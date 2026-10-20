import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { sendBatchNotifications } from '../_shared/fcm-helper.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export default async (req: Request) => {
  try {
    console.log('🎯 Starting incomplete goals reminder check...');

    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return new Response(JSON.stringify({ error: 'Failed to fetch users' }), { status: 500 });
    }

    let notificationsSent = 0;

    for (const user of users || []) {
      // Check if user has logged activity today
      const today = new Date().toISOString().split('T')[0];
      const todayStart = `${today}T00:00:00Z`;
      const todayEnd = `${today}T23:59:59Z`;

      const { data: todayActivity, error: activityError } = await supabase
        .from('accomplishment_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', todayStart)
        .lte('created_at', todayEnd)
        .limit(1);

      if (activityError) {
        console.error('Error checking activity:', activityError);
        continue;
      }

      // If activity logged today, check if all goals are complete
      if (todayActivity && todayActivity.length > 0) {
        // Get today's goals
        const { data: goals, error: goalsError } = await supabase
          .from('daily_goals')
          .select('id, completed')
          .eq('user_id', user.id)
          .gte('created_at', todayStart)
          .lte('created_at', todayEnd);

        if (goalsError) {
          console.error('Error fetching goals:', goalsError);
          continue;
        }

        // Check if any goals are incomplete
        const hasIncompleteGoals = goals && goals.some(g => !g.completed);

        if (hasIncompleteGoals) {
          // Check if user has notifications enabled
          const { data: preferences, error: prefError } = await supabase
            .from('user_preferences')
            .select('notifications_enabled')
            .eq('user_id', user.id)
            .single();

          if (prefError || !preferences?.notifications_enabled) {
            console.log(`⏭️ Skipping notification for ${user.id} - notifications disabled`);
            continue;
          }

          // Get user's FCM tokens
          const { data: tokens, error: tokensError } = await supabase
            .from('fcm_tokens')
            .select('fcm_token')
            .eq('user_id', user.id);

          if (tokensError) {
            console.error('Error fetching FCM tokens:', tokensError);
            continue;
          }

          if (tokens && tokens.length > 0) {
            const fcmTokens = tokens.map(t => t.fcm_token);
            const sent = await sendBatchNotifications(
              fcmTokens,
              {
                title: '🎯 Complete Your Goals',
                body: "You've made progress! Complete your remaining goals today.",
                icon: 'ic_launcher',
                color: '#58CC02',
              },
              {
                type: 'incomplete_goals_reminder',
                userId: user.id,
              }
            );

            notificationsSent += sent;
            console.log(`✅ Sent incomplete goals reminder to ${user.id}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, notificationsSent }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
