-- Create better_self_activity_logs table
CREATE TABLE better_self_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES better_self_conversations(id) ON DELETE SET NULL,
  activity_description TEXT NOT NULL,
  matched_goals JSONB, -- Array of matched goals with completion %
  unrelated_activities TEXT[], -- Activities that don't match goals
  logged_to_goals BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_better_self_activity_logs_user_id ON better_self_activity_logs(user_id);
CREATE INDEX idx_better_self_activity_logs_conversation_id ON better_self_activity_logs(conversation_id);
CREATE INDEX idx_better_self_activity_logs_logged_to_goals ON better_self_activity_logs(logged_to_goals);

-- Enable RLS
ALTER TABLE better_self_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own activity logs
CREATE POLICY "Users can view their own activity logs"
  ON better_self_activity_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own activity logs
CREATE POLICY "Users can insert their own activity logs"
  ON better_self_activity_logs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own activity logs
CREATE POLICY "Users can update their own activity logs"
  ON better_self_activity_logs
  FOR UPDATE
  USING (auth.uid() = user_id);
