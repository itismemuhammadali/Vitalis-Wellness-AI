import type { Database } from '@/lib/database/types';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * Admin client with service role key
 * Used for server-side operations like confirming emails
 * WARNING: Never expose this key to the client!
 */
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  }
);

/**
 * Confirm a user's email after signup
 * This bypasses the email confirmation requirement
 */
export async function confirmUserEmail(userId: string) {
  try {
    console.log('📝 Confirming email for user:', userId);
    
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      email_confirm: true,
    });

    if (error) {
      console.error('❌ Failed to confirm email:', error);
      throw error;
    }

    console.log('✅ Email confirmed for user:', userId);
    return true;
  } catch (error) {
    console.error('❌ Error confirming email:', error);
    throw error;
  }
}
