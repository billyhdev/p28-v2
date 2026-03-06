/**
 * Shared DTOs (camelCase). Adapters map backend responses to these types.
 * Extend as needed for later stories (e.g. Group, Message).
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

/** Group type: forum (discussions) or ministry (announcements, events, recurring services). */
export type GroupType = 'forum' | 'ministry';

/** Group (Forum or Ministry). Top-level concept. From groups table. */
export interface Group {
  id: string;
  type: GroupType;
  name: string;
  description?: string;
  bannerImageUrl?: string;
  preferredLanguage: string;
  country: string;
  createdByUserId: string;
  createdAt?: string;
  updatedAt?: string;
  /** Number of members (when fetched with count). */
  memberCount?: number;
}

/** Input for creating a group. */
export interface CreateGroupInput {
  type: GroupType;
  name: string;
  description?: string;
  bannerImageUrl?: string;
  preferredLanguage?: string;
  country?: string;
}

/** Input for updating a group (partial). */
export interface UpdateGroupInput {
  name?: string;
  description?: string;
  bannerImageUrl?: string;
  preferredLanguage?: string;
  country?: string;
}

/** Group membership. From group_members table. */
export interface GroupMember {
  userId: string;
  groupId: string;
  joinedAt?: string;
}

/** Group admin (creator or assigned). From group_admins table. */
export interface GroupAdmin {
  userId: string;
  groupId: string;
  assignedAt?: string;
}
