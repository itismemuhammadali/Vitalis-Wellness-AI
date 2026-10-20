-- Create table for storing accomplishment logs with original text only
CREATE TABLE IF NOT EXISTS accomplishment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  original_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accomplishment_logs_user_id ON accomplishment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_accomplishment_logs_date ON accomplishment_logs(log_date);

-- Enable RLS (Row Level Security)
ALTER TABLE accomplishment_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own accomplishment logs" ON accomplishment_logs;
DROP POLICY IF EXISTS "Users can insert their own accomplishment logs" ON accomplishment_logs;
DROP POLICY IF EXISTS "Users can update their own accomplishment logs" ON accomplishment_logs;

-- Create RLS policies for accomplishment_logs
CREATE POLICY "Users can view their own accomplishment logs"
  ON accomplishment_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own accomplishment logs"
  ON accomplishment_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own accomplishment logs"
  ON accomplishment_logs FOR UPDATE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE accomplishment_logs IS 'Stores the original accomplishment text entered by users';
COMMENT ON COLUMN accomplishment_logs.original_text IS 'The complete text describing what the user accomplished';
