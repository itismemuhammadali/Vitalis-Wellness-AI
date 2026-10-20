import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { sendBatchNotifications } from '../_shared/fcm-helper.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export default async (req: Request) => {
  try {
    console.log('🔔 Starting inactivity reminder check...');

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
      // Check if user has logged any activity in last 24 hours
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentActivity, error: activityError } = await supabase
        .from('accomplishment_logs')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', twentyFourHoursAgo)
        .limit(1);

      if (activityError) {
        console.error('Error checking activity:', activityError);
        continue;
      }

      // If no activity in 24 hours, send reminder
      if (!recentActivity || recentActivity.length === 0) {
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
              title: '⏰ Time to Log Activity',
              body: "You haven't logged any activity today. Let's get back on track!",
              icon: 'ic_launcher',
              color: '#58CC02',
            },
            {
              type: 'inactivity_reminder',
              userId: user.id,
            }
          );

          notificationsSent += sent;
          console.log(`✅ Sent inactivity reminder to ${user.id}`);
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
