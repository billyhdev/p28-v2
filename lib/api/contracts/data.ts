import type { ApiError } from './errors';
import type {
  NotificationPreferences,
  NotificationPreferencesUpdates,
  OnboardingProfileData,
  Profile,
  ProfileUpdates,
} from './dto';

/**
 * Data contract: domain operations. No backend-specific types.
 * Expand with getOrganizations, getGroupsForMinistry, getMessagesForChannel, etc. in later stories.
 * Adapters implement these; app code uses only the facade.
 */
export interface DataContract {
  getProfile(userId: string): Promise<Profile | ApiError>;
  createProfile(userId: string, data: OnboardingProfileData): Promise<Profile | ApiError>;
  updateProfile(userId: string, updates: ProfileUpdates): Promise<Profile | ApiError>;
  /** When base64Data is provided (e.g. from picker with base64: true), it is used for upload and imageUri is only for fallback/logging. */
  uploadProfileImage(
    userId: string,
    imageUri: string,
    base64Data?: string | null
  ): Promise<string | ApiError>;

  getNotificationPreferences(userId: string): Promise<NotificationPreferences | ApiError>;
  updateNotificationPreferences(
    userId: string,
    updates: NotificationPreferencesUpdates
  ): Promise<NotificationPreferences | ApiError>;
}
