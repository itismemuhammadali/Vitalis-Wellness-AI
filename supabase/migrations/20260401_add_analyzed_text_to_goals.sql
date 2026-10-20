-- Add analyzed_text column to daily_goal_logs to store the analyzed accomplishment text
ALTER TABLE daily_goal_logs
ADD COLUMN analyzed_text TEXT;

-- Add analyzed_text column to custom_goals to store the analyzed accomplishment text
ALTER TABLE custom_goals
ADD COLUMN analyzed_text TEXT;

-- Add comments
COMMENT ON COLUMN daily_goal_logs.analyzed_text IS 'The portion of accomplishment text that was analyzed and matched to this goal';
COMMENT ON COLUMN custom_goals.analyzed_text IS 'The portion of accomplishment text that was analyzed and matched to this goal';
