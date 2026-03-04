import type { ApiError } from './errors';
import type {
  CreateGroupInput,
  CreateMinistryInput,
  CreateOrganizationInput,
  Group,
  Ministry,
  NotificationPreferences,
  NotificationPreferencesUpdates,
  OnboardingProfileData,
  Organization,
  Profile,
  ProfileUpdates,
  UpdateGroupInput,
  UpdateMinistryInput,
  UpdateOrganizationInput,
} from './dto';

/**
 * Data contract: domain operations. No backend-specific types.
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

  // Organization structure (Story 2.2)
  getOrganizations(): Promise<Organization[] | ApiError>;
  createOrganization(params: CreateOrganizationInput): Promise<Organization | ApiError>;
  updateOrganization(id: string, params: UpdateOrganizationInput): Promise<Organization | ApiError>;

  getMinistriesForOrg(organizationId: string): Promise<Ministry[] | ApiError>;
  createMinistry(organizationId: string, params: CreateMinistryInput): Promise<Ministry | ApiError>;
  updateMinistry(id: string, params: UpdateMinistryInput): Promise<Ministry | ApiError>;

  getGroupsForMinistry(ministryId: string): Promise<Group[] | ApiError>;
  createGroup(ministryId: string, params: CreateGroupInput): Promise<Group | ApiError>;
  updateGroup(id: string, params: UpdateGroupInput): Promise<Group | ApiError>;
}
