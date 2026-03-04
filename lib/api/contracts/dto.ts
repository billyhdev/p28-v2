/**
 * Shared DTOs (camelCase). Adapters map backend responses to these types.
 * Extend as needed for later stories (e.g. Organization, Ministry, Group, Message).
 */

export interface User {
  id: string;
  email?: string;
  createdAt?: string;
}

export interface Session {
  accessToken: string;
  refreshToken?: string;
  /** ISO 8601 date string when the session expires */
  expiresAt?: string;
  user: User;
}

export interface Profile {
  userId: string;
  displayName?: string;
  firstName?: string;
  lastName?: string;
  /** ISO-8601 date string (YYYY-MM-DD) */
  birthDate?: string;
  /** Country code or name (fixed list in UI) */
  country?: string;
  /** App locale/language code (e.g. en, es) */
  preferredLanguage?: string;
  avatarUrl?: string;
  bio?: string;
  updatedAt?: string;
}

export interface ProfileUpdates {
  displayName?: string;
  avatarUrl?: string;
  bio?: string;
  preferredLanguage?: string;
}

export type OnboardingProfileData = {
  firstName: string;
  lastName: string;
  /** ISO-8601 date string (YYYY-MM-DD) */
  birthDate?: string;
  country?: string;
  preferredLanguage?: string;
};

/** Notification preference settings per user. Stored in notification_preferences table. */
export interface NotificationPreferences {
  userId: string;
  eventsEnabled: boolean;
  announcementsEnabled: boolean;
  messagesEnabled: boolean;
  updatedAt?: string;
}

/** Partial updates for notification preferences. */
export interface NotificationPreferencesUpdates {
  eventsEnabled?: boolean;
  announcementsEnabled?: boolean;
  messagesEnabled?: boolean;
}

/** Organization (church). From organizations table. */
export interface Organization {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Input for creating an organization. */
export interface CreateOrganizationInput {
  name: string;
}

/** Input for updating an organization (partial). */
export interface UpdateOrganizationInput {
  name?: string;
}

/** Ministry within an organization. From ministries table. */
export interface Ministry {
  id: string;
  organizationId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Input for creating a ministry. */
export interface CreateMinistryInput {
  name: string;
}

/** Input for updating a ministry (partial). */
export interface UpdateMinistryInput {
  name?: string;
}

/** Group within a ministry. From groups table. */
export interface Group {
  id: string;
  ministryId: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Input for creating a group. */
export interface CreateGroupInput {
  name: string;
}

/** Input for updating a group (partial). */
export interface UpdateGroupInput {
  name?: string;
}
