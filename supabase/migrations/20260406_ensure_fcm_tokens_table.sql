-- Ensure FCM tokens table exists (idempotent)
CREATE TABLE IF NOT EXISTS fcm_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token TEXT NOT NULL,
  device_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, fcm_token)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_user_id ON fcm_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_fcm_tokens_fcm_token ON fcm_tokens(fcm_token);

-- Enable RLS if not already enabled
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can insert their own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can update their own FCM tokens" ON fcm_tokens;
DROP POLICY IF EXISTS "Users can delete their own FCM tokens" ON fcm_tokens;

-- Create RLS policies
CREATE POLICY "Users can view their own FCM tokens"
  ON fcm_tokens
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own FCM tokens"
  ON fcm_tokens
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own FCM tokens"
  ON fcm_tokens
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own FCM tokens"
  ON fcm_tokens
  FOR DELETE
  USING (auth.uid() = user_id);
