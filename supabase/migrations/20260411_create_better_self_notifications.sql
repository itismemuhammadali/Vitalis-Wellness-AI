-- Create better_self_notifications table
CREATE TABLE better_self_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('end_of_day_reminder', 'achievement', 'check_in', 'motivation')),
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_better_self_notifications_user_id ON better_self_notifications(user_id);
CREATE INDEX idx_better_self_notifications_sent_at ON better_self_notifications(sent_at);
CREATE INDEX idx_better_self_notifications_read_at ON better_self_notifications(read_at);

-- Enable RLS
ALTER TABLE better_self_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
  ON better_self_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own notifications
CREATE POLICY "Users can insert their own notifications"
  ON better_self_notifications
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own notifications
CREATE POLICY "Users can update their own notifications"
  ON better_self_notifications
  FOR UPDATE
  USING (auth.uid() = user_id);
