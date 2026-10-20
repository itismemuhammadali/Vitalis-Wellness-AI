-- Create custom_goals table for user-created goals
CREATE TABLE custom_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  deadline DATE NOT NULL,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  estimated_time INTEGER DEFAULT 30,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_custom_goals_user_id ON custom_goals(user_id);
CREATE INDEX idx_custom_goals_deadline ON custom_goals(deadline);
CREATE INDEX idx_custom_goals_status ON custom_goals(status);
CREATE INDEX idx_custom_goals_user_status ON custom_goals(user_id, status);

-- Enable RLS (Row Level Security)
ALTER TABLE custom_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own goals
CREATE POLICY "Users can view their own custom goals"
  ON custom_goals
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can only insert their own goals
CREATE POLICY "Users can create their own custom goals"
  ON custom_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only update their own goals
CREATE POLICY "Users can update their own custom goals"
  ON custom_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only delete their own goals
CREATE POLICY "Users can delete their own custom goals"
  ON custom_goals
  FOR DELETE
  USING (auth.uid() = user_id);

-- Add comments
COMMENT ON TABLE custom_goals IS 'User-created custom goals with deadlines';
COMMENT ON COLUMN custom_goals.id IS 'Unique identifier for the custom goal';
COMMENT ON COLUMN custom_goals.user_id IS 'Reference to the user who created the goal';
COMMENT ON COLUMN custom_goals.title IS 'Goal title';
COMMENT ON COLUMN custom_goals.description IS 'Detailed description of the goal';
COMMENT ON COLUMN custom_goals.category IS 'Goal category (health, growth, career, social, other)';
COMMENT ON COLUMN custom_goals.deadline IS 'Target deadline for completing the goal';
COMMENT ON COLUMN custom_goals.difficulty IS 'Difficulty level (easy, medium, hard)';
COMMENT ON COLUMN custom_goals.estimated_time IS 'Estimated time in minutes to complete';
COMMENT ON COLUMN custom_goals.status IS 'Current status (active, completed, archived)';
