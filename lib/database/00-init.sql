-- ============================================
-- KYVO DATABASE INITIALIZATION
-- ============================================
-- Run this first before creating any tables
-- Enables required PostgreSQL extensions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable pgjwt for JWT handling
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- Create schema if not exists
CREATE SCHEMA IF NOT EXISTS public;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- ============================================
-- INITIALIZATION COMPLETE
-- ============================================
-- All extensions are now enabled
-- Ready to create tables
