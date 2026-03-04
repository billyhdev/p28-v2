/**
 * English (en) translation strings.
 * Keys are namespaced: tabs.*, profile.*, auth.*, common.*, language.*
 */
export const en = {
  tabs: {
    home: 'Home',
    groups: 'Groups',
    messages: 'Messages',
    profile: 'Profile',
    appInfo: 'App info',
    appInfoHint: 'Opens app information modal',
  },
  profile: {
    title: 'Profile',
    editProfile: 'Edit profile',
    notificationPreferences: 'Notification preferences',
    signOut: 'Sign out',
    about: 'About',
    displayName: 'Display name',
    firstName: 'First name',
    lastName: 'Last name',
    birthDate: 'Birth date',
    country: 'Country',
    preferredLanguage: 'Preferred language',
    bio: 'Bio',
    bioPlaceholder: 'Add a short bio to help others get to know you.',
    completeProfile: 'Complete your profile',
    completeProfileHint:
      'Add your name, country, and preferred language so your profile looks great across the app.',
    completeOnboarding: 'Complete onboarding',
    appLanguage: 'App language',
    appLanguageHint: 'Choose the language for the app interface',
    changePhoto: 'Change profile photo',
    changePhotoHint: 'Opens photo library to choose a new profile picture',
    saveHint: 'Saves profile changes',
    saveHintDisabled: 'Save is disabled until you make changes',
    saving: 'Saving…',
    profilePhoto: 'Profile photo',
    photoPermissionRequired: 'Permission to access photos is required.',
    displayNamePlaceholder: "How you'd like to be called",
    bioPlaceholderEdit: 'Tell others about yourself (optional)',
    birthDateFormatError: 'Birth date must be in YYYY-MM-DD format.',
    selectDateOptional: 'Select date (optional)',
  },
  auth: {
    signIn: 'Sign in',
    signOut: 'Sign out',
    signOutConfirm: 'Are you sure you want to sign out?',
    cancel: 'Cancel',
    createAccount: 'Create an account',
    alreadyHaveAccountSignIn: 'Already have an account? Sign in',
    backToSignIn: 'Back to sign in',
    signInSubtitle: 'Use your email and password to sign in.',
    createAccountSubtitle: "Enter your email and a password. We'll ask for a few details next.",
    signingIn: 'Signing in…',
    checking: 'Checking…',
  },
  language: {
    title: 'App language',
    subtitle: 'Choose the language for the app interface',
    english: 'English',
    korean: 'Korean',
    khmer: 'Khmer',
    updated: 'Language updated',
    selectLanguage: 'Select language',
  },
  common: {
    loading: 'Loading',
    save: 'Save',
    cancel: 'Cancel',
    retry: 'Retry',
    error: 'Something went wrong',
    continue: 'Continue',
    done: 'Done',
  },
  notifications: {
    intro: 'Choose which types of notifications you want to receive.',
    typesTitle: 'Notification types',
    events: 'Events',
    announcements: 'Announcements',
    messages: 'Messages',
    saved: 'Preferences saved',
    retry: 'Try again',
    retryHint: 'Retries loading notification preferences',
    loadingLabel: 'Loading notification preferences',
  },
} as const;

/** Shape of translation object (all values string). Use for ko/km typing. */
export type TranslationShape = {
  [K in keyof typeof en]: {
    [P in keyof (typeof en)[K]]: string;
  };
};
