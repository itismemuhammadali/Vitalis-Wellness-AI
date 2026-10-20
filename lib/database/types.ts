// ============================================
// KYVO DATABASE TYPES
// ============================================
// TypeScript types for all database tables
// Use these for type safety in your app

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// ============================================
// USERS TABLE
// ============================================
export interface User {
  id: string;
  email: string;
  full_name: string | null;
  date_of_birth: string | null;
  avatar_url: string | null; // User's profile picture (uploaded by user)
  current_photo_url: string | null;
  better_self_avatar_url: string | null; // AI-generated avatar (from OpenAI)
  bio: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// ASPIRATIONS TABLE
// ============================================
export interface Aspiration {
  id: string;
  user_id: string;
  description: string;
  deadline: string | null;
  deadline_days: number | null;
  status: "active" | "completed" | "archived";
  created_at: string;
  updated_at: string;
}

// ============================================
// GOALS TABLE
// ============================================
export interface Goal {
  id: string;
  user_id: string;
  aspiration_id: string;
  title: string;
  description: string | null;
  category: string | null;
  start_value: number | null;
  current_value: number | null;
  target_value: number | null;
  unit: string | null;
  deadline: string;
  status: "active" | "completed" | "archived";
  priority: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// BASELINE ANSWERS TABLE
// ============================================
export interface BaselineAnswer {
  id: string;
  user_id: string;
  goal_id: string;
  question: string;
  answer: string;
  question_type: string | null;
  order_index: number | null;
  created_at: string;
}

// ============================================
// LOGS TABLE
// ============================================
export interface Log {
  id: string;
  user_id: string;
  goal_id: string;
  value: number;
  note: string | null;
  log_date: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// STREAKS TABLE
// ============================================
export interface Streak {
  id: string;
  user_id: string;
  goal_id: string;
  current_streak: number;
  longest_streak: number;
  last_log_date: string | null;
  streak_start_date: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// BETTER SELF AVATARS TABLE
// ============================================
export interface BetterSelfAvatar {
  id: string;
  user_id: string;
  goal_id: string;
  avatar_url: string;
  progress_percentage: number;
  prompt: string | null;
  model: string;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

// ============================================
// USER XP TABLE
// ============================================
export interface UserXP {
  id: string;
  user_id: string;
  total_xp: number;
  current_level: "Beginner" | "Consistent" | "Elite" | "Unbreakable";
  level_progress: number;
  xp_to_next_level: number;
  lifetime_xp: number;
  created_at: string;
  updated_at: string;
}

// ============================================
// ACHIEVEMENTS TABLE
// ============================================
export interface Achievement {
  id: string;
  user_id: string;
  achievement_type: string;
  title: string;
  description: string | null;
  icon_url: string | null;
  xp_reward: number;
  progress_value: number;
  progress_target: number;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// XP TRANSACTIONS TABLE
// ============================================
export interface XPTransaction {
  id: string;
  user_id: string;
  goal_id: string | null;
  xp_amount: number;
  transaction_type: string;
  reason: string | null;
  multiplier: number;
  created_at: string;
}

// ============================================
// TIME CAPSULES TABLE
// ============================================
export interface TimeCapsule {
  id: string;
  user_id: string;
  message_type: "text" | "voice" | "video";
  message_url: string | null;
  message_text: string | null;
  unlock_date: string;
  is_unlocked: boolean;
  unlocked_at: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// SETTINGS TABLE
// ============================================
export interface Settings {
  id: string;
  user_id: string;
  openai_api_key: string | null;
  notification_enabled: boolean;
  daily_reminder_time: string | null;
  daily_reminder_enabled: boolean;
  email_notifications: boolean;
  push_notifications: boolean;
  theme: "light" | "dark";
  language: string;
  timezone: string;
  subscription_plan: string;
  subscription_status: "active" | "inactive" | "cancelled";
  created_at: string;
  updated_at: string;
}

// ============================================
// SUBSCRIPTION PLANS TABLE
// ============================================
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  billing_period: "monthly" | "yearly";
  features: Json | null;
  max_goals: number | null;
  max_logs_per_day: number | null;
  ai_questions_enabled: boolean;
  avatar_generation_enabled: boolean;
  status: "active" | "archived";
  created_at: string;
  updated_at: string;
}

// ============================================
// SUBSCRIPTION HISTORY TABLE
// ============================================
export interface SubscriptionHistory {
  id: string;
  user_id: string;
  plan_id: string;
  event_type: "upgrade" | "downgrade" | "cancel" | "renew";
  previous_plan_id: string | null;
  start_date: string;
  end_date: string | null;
  amount: number | null;
  status: "active" | "completed" | "cancelled";
  notes: string | null;
  created_at: string;
}

// ============================================
// COMBINED TYPES FOR QUERIES
// ============================================

// User with all related data
export interface UserWithData extends User {
  aspirations?: Aspiration[];
  goals?: Goal[];
  logs?: Log[];
  streaks?: Streak[];
  settings?: Settings;
  user_xp?: UserXP;
  achievements?: Achievement[];
}

// Goal with related data
export interface GoalWithData extends Goal {
  aspiration?: Aspiration;
  baseline_answers?: BaselineAnswer[];
  logs?: Log[];
  streaks?: Streak[];
  better_self_avatars?: BetterSelfAvatar[];
}

// Aspiration with related data
export interface AspirationWithData extends Aspiration {
  goals?: GoalWithData[];
}

// ============================================
// DATABASE SCHEMA TYPE
// ============================================
export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, "created_at" | "updated_at"> & { id?: string };
        Update: Partial<Omit<User, "id" | "created_at">>;
      };
      aspirations: {
        Row: Aspiration;
        Insert: Omit<Aspiration, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<Aspiration, "id" | "created_at">>;
      };
      goals: {
        Row: Goal;
        Insert: Omit<Goal, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<Goal, "id" | "created_at">>;
      };
      baseline_answers: {
        Row: BaselineAnswer;
        Insert: Omit<BaselineAnswer, "created_at" | "id">;
        Update: Partial<Omit<BaselineAnswer, "id" | "created_at">>;
      };
      logs: {
        Row: Log;
        Insert: Omit<Log, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<Log, "id" | "created_at">>;
      };
      streaks: {
        Row: Streak;
        Insert: Omit<Streak, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<Streak, "id" | "created_at">>;
      };
      better_self_avatars: {
        Row: BetterSelfAvatar;
        Insert: Omit<BetterSelfAvatar, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<BetterSelfAvatar, "id" | "created_at">>;
      };
      time_capsules: {
        Row: TimeCapsule;
        Insert: Omit<TimeCapsule, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<TimeCapsule, "id" | "created_at">>;
      };
      settings: {
        Row: Settings;
        Insert: Omit<Settings, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<Settings, "id" | "created_at">>;
      };
      subscription_plans: {
        Row: SubscriptionPlan;
        Insert: Omit<SubscriptionPlan, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<SubscriptionPlan, "id" | "created_at">>;
      };
      subscription_history: {
        Row: SubscriptionHistory;
        Insert: Omit<SubscriptionHistory, "created_at" | "id">;
        Update: Partial<Omit<SubscriptionHistory, "id" | "created_at">>;
      };
      user_xp: {
        Row: UserXP;
        Insert: Omit<UserXP, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<UserXP, "id" | "created_at">>;
      };
      achievements: {
        Row: Achievement;
        Insert: Omit<Achievement, "created_at" | "updated_at" | "id">;
        Update: Partial<Omit<Achievement, "id" | "created_at">>;
      };
      xp_transactions: {
        Row: XPTransaction;
        Insert: Omit<XPTransaction, "created_at" | "id">;
        Update: Partial<Omit<XPTransaction, "id" | "created_at">>;
      };
    };
  };
}
