import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';
import { sendBatchNotifications } from '../_shared/fcm-helper.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

export default async (req: Request) => {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Sending new goals notification to user ${userId}`);

    // Check if user has notifications enabled
    const { data: preferences, error: prefError } = await supabase
      .from('user_preferences')
      .select('notifications_enabled')
      .eq('user_id', userId)
      .single();

    if (prefError || !preferences?.notifications_enabled) {
      console.log(`⏭️ Skipping notification for ${userId} - notifications disabled`);
      return new Response(
        JSON.stringify({ success: true, notificationsSent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user's FCM tokens
    const { data: tokens, error: tokensError } = await supabase
      .from('fcm_tokens')
      .select('fcm_token')
      .eq('user_id', userId);

    if (tokensError) {
      console.error('Error fetching FCM tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch FCM tokens' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log('No FCM tokens found for user');
      return new Response(
        JSON.stringify({ success: true, notificationsSent: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const fcmTokens = tokens.map(t => t.fcm_token);
    const sent = await sendBatchNotifications(
      fcmTokens,
      {
        title: '✨ New Daily Goals',
        body: 'Your new daily goals are ready! Check them out and start your day strong.',
        icon: 'ic_launcher',
        color: '#58CC02',
      },
      {
        type: 'new_goals',
        userId: userId,
      }
    );

    return new Response(
      JSON.stringify({ success: true, notificationsSent: sent }),
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
