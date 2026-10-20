-- Create better_self_conversations table
CREATE TABLE better_self_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('user', 'assistant')),
  detected_activity JSONB, -- Stores parsed activity data
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_better_self_conversations_user_id ON better_self_conversations(user_id);
CREATE INDEX idx_better_self_conversations_created_at ON better_self_conversations(created_at);

-- Enable RLS
ALTER TABLE better_self_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see their own conversations
CREATE POLICY "Users can view their own conversations"
  ON better_self_conversations
  FOR SELECT
  USING (auth.uid() = user_id);

-- RLS Policy: Users can insert their own conversations
CREATE POLICY "Users can insert their own conversations"
  ON better_self_conversations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own conversations
CREATE POLICY "Users can update their own conversations"
  ON better_self_conversations
  FOR UPDATE
  USING (auth.uid() = user_id);
