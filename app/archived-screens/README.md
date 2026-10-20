# Archived Screens

This folder contains screens and features from previous iterations that are no longer in the active flow but are kept for reference and potential future use.

## Folder Structure

```
archived-screens/
├── onboarding-screens/     - All archived onboarding flow screens
│   ├── aspiration-*.tsx    - Old multi-step aspiration screens
│   ├── set-goals.tsx       - Category-based goal selection
│   ├── create-custom-goal.tsx
│   ├── sign-commitment.tsx
│   ├── potential.tsx
│   ├── complete-journey.tsx
│   ├── enable-voice-features.tsx
│   ├── gender-selection.tsx
│   └── README.md
└── post-onboarding/        - All post-onboarding flow screens
```

## Current Active Onboarding Flow

1. Welcome
2. Notification Permission
3. Aspiration (single general question)
4. Time Capsule
5. Avatar Creation

## Restoring Archived Screens

If you need to restore any archived screens to the active flow:

1. Move the file(s) from the appropriate subfolder back to `app/screens/`
2. Update the routing in the corresponding `_layout.tsx`
3. Update any navigation references in other screens

## Notes

- All screens in this folder are no longer part of the active application flow
- Keep this folder organized by feature/flow type for easy reference
- Document any changes or reasons for archiving in the respective README files
