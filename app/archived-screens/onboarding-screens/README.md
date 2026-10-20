# Archived Screens

This folder contains screens and features from previous iterations that are no longer in the active flow but may be needed in the future.

## Structure

### Archived Onboarding Screens

#### Aspiration Screens (Old Multi-Step Approach)
- `aspiration-financial.tsx` - Financial goals screen
- `aspiration-health.tsx` - Health & fitness goals screen
- `aspiration-career.tsx` - Career & skills goals screen
- `aspiration-lifestyle.tsx` - Personal & lifestyle goals screen

**Status:** Replaced by single `aspiration.tsx` screen with general question

#### Goal Setting Screens
- `set-goals.tsx` - Category-based goal selection
- `create-custom-goal.tsx` - Custom goal creation
- `sign-commitment.tsx` - Commitment signing screen

**Status:** Removed from simplified flow

#### Other Screens
- `potential.tsx` - Potential/motivation screen
- `complete-journey.tsx` - Journey completion/review screen
- `enable-voice-features.tsx` - Voice/video feature permission screen
- `gender-selection.tsx` - Gender selection screen

**Status:** Removed from simplified flow

### Post-Onboarding Screens
- `post-onboarding/` - Contains all post-onboarding flow screens

**Status:** Archived for future reference

## Current Active Onboarding Flow

1. Welcome
2. Notification Permission
3. Aspiration (single general question)
4. Time Capsule
5. Avatar Creation

## Notes

These files are kept for reference and potential future use. If you need to restore any of these screens to the active flow:

1. Move the file(s) back to the appropriate location
2. Update the routing in the corresponding `_layout.tsx`
3. Update any navigation references

All screens in this folder are no longer part of the active application flow.
