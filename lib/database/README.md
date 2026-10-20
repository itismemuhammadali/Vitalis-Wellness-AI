# KYVO Database Schema

This folder contains all database schema files for KYVO. Each table has its own file for clarity and maintainability.

## Structure

```
lib/database/
├── README.md (this file)
├── 00-init.sql (initialization - run first)
├── tables/
│   ├── 01-users.sql
│   ├── 02-aspirations.sql
│   ├── 03-goals.sql
│   ├── 04-baseline-answers.sql
│   ├── 05-logs.sql
│   ├── 06-streaks.sql
│   ├── 07-better-self-avatars.sql
│   ├── 08-time-capsules.sql
│   ├── 09-settings.sql
│   ├── 10-subscription-plans.sql
│   └── 11-subscription-history.sql
├── policies/
│   ├── users-policies.sql
│   ├── aspirations-policies.sql
│   ├── goals-policies.sql
│   ├── baseline-answers-policies.sql
│   ├── logs-policies.sql
│   ├── streaks-policies.sql
│   ├── better-self-avatars-policies.sql
│   ├── time-capsules-policies.sql
│   ├── settings-policies.sql
│   ├── subscription-plans-policies.sql
│   └── subscription-history-policies.sql
├── storage/
│   └── storage-buckets.sql
└── migrations/
    └── 001-initial-schema.sql (master file - runs all above)
```

## How to Use

### Option 1: Run Individual Files (for testing)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste each file in order (00-init.sql first, then tables, then policies)
3. Execute each one

### Option 2: Run Master Migration (recommended)
1. Go to Supabase Dashboard → SQL Editor
2. Copy and paste `migrations/001-initial-schema.sql`
3. Execute once - it runs everything

## Files Execution Order

1. `00-init.sql` - Enable extensions
2. `tables/01-users.sql` through `tables/11-subscription-history.sql`
3. `policies/users-policies.sql` through `policies/subscription-history-policies.sql`
4. `storage/storage-buckets.sql`

## What Each File Does

### Tables
- **users.sql** - User profiles (extends auth.users)
- **aspirations.sql** - Main goal/aspiration
- **goals.sql** - Broken down goals
- **baseline-answers.sql** - Answers to AI questions
- **logs.sql** - Daily progress entries
- **streaks.sql** - Consistency tracking
- **better-self-avatars.sql** - AI-generated avatars at different progress levels
- **time-capsules.sql** - Messages to future self
- **settings.sql** - User preferences and API keys
- **subscription-plans.sql** - Available subscription tiers
- **subscription-history.sql** - User subscription history

### Policies
- Each table has its own RLS policies file
- Policies ensure users can only access their own data
- Policies are database-level security (not app-level)

### Storage
- Creates public and private buckets for files
- Buckets: avatars, better-self-avatars, time-capsules

## Testing

After running migrations:
1. Go to Supabase Dashboard → Table Editor
2. Verify all 11 tables exist
3. Go to Authentication → Users
4. Create a test user
5. Go to Table Editor → users table
6. Verify test user appears (RLS working)

## Notes

- All tables have `created_at` and `updated_at` timestamps
- All tables have proper foreign key constraints
- All tables have RLS enabled
- Cascade delete is enabled where appropriate
- UUIDs are used for all primary keys
