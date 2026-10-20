-- ============================================
-- SUPABASE STORAGE BUCKETS
-- ============================================
-- Note: Storage buckets are created via Supabase Dashboard
-- This file documents the required buckets and their configuration

-- BUCKET 1: avatars (PUBLIC)
-- Purpose: Store user's current self photos
-- Path: avatars/{user_id}/current-self.jpg
-- Access: Public (anyone can view)
-- Max size: 10MB per file

-- BUCKET 2: better-self-avatars (PRIVATE)
-- Purpose: Store AI-generated better self avatars
-- Path: better-self-avatars/{user_id}/{goal_id}/{progress_percentage}.jpg
-- Access: Private (only user can view)
-- Max size: 10MB per file
-- Stores: 0%, 25%, 50%, 75%, 100% progress avatars

-- BUCKET 3: time-capsules (PRIVATE)
-- Purpose: Store time capsule messages (video/audio)
-- Path: time-capsules/{user_id}/{capsule_id}.mp4 or .m4a
-- Access: Private (only user can view)
-- Max size: 100MB per file

-- ============================================
-- STORAGE BUCKET CONFIGURATION
-- ============================================

-- To create these buckets in Supabase Dashboard:
-- 1. Go to Storage → Buckets
-- 2. Click "New Bucket"
-- 3. Create each bucket with settings below:

-- BUCKET 1: avatars
-- Name: avatars
-- Public: Yes
-- File size limit: 10 MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- BUCKET 2: better-self-avatars
-- Name: better-self-avatars
-- Public: No
-- File size limit: 10 MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- BUCKET 3: time-capsules
-- Name: time-capsules
-- Public: No
-- File size limit: 100 MB
-- Allowed MIME types: video/mp4, audio/mp4, audio/mpeg

-- ============================================
-- STORAGE BUCKET POLICIES
-- ============================================

-- Note: Storage policies are configured in Supabase Dashboard
-- Go to Storage → Policies for each bucket

-- AVATARS BUCKET POLICIES:
-- SELECT: Public (anyone can view)
-- INSERT: Authenticated users (can upload their own)
-- UPDATE: Authenticated users (can update their own)
-- DELETE: Authenticated users (can delete their own)

-- BETTER-SELF-AVATARS BUCKET POLICIES:
-- SELECT: Authenticated users (can view their own)
-- INSERT: Authenticated users (can upload their own)
-- UPDATE: Authenticated users (can update their own)
-- DELETE: Authenticated users (can delete their own)

-- TIME-CAPSULES BUCKET POLICIES:
-- SELECT: Authenticated users (can view their own)
-- INSERT: Authenticated users (can upload their own)
-- UPDATE: Authenticated users (can update their own)
-- DELETE: Authenticated users (can delete their own)

-- ============================================
-- STORAGE BUCKETS COMPLETE
-- ============================================
