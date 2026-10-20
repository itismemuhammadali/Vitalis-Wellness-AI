-- ============================================
-- USERS TABLE
-- ============================================
-- Extends auth.users with profile information
-- One row per user

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  current_photo_url TEXT,
  better_self_avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Create index on user_id for foreign key lookups
CREATE INDEX IF NOT EXISTS idx_users_id ON public.users(id);

-- ============================================
-- USERS TABLE COMPLETE
-- ============================================
