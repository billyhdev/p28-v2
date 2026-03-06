import type { ApiError } from './errors';
import type {
  CreateGroupInput,
  Group,
  GroupAdmin,
  GroupMember,
  NotificationPreferences,
  NotificationPreferencesUpdates,
  OnboardingProfileData,
  Profile,
  ProfileUpdates,
  UpdateGroupInput,
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

  // Groups (Forums and Ministries - top level)
  getGroups(params?: { type?: 'forum' | 'ministry'; search?: string }): Promise<Group[] | ApiError>;
  getGroup(id: string): Promise<Group | ApiError>;
  createGroup(params: CreateGroupInput, createdByUserId: string): Promise<Group | ApiError>;
  updateGroup(id: string, params: UpdateGroupInput): Promise<Group | ApiError>;

  // Group membership
  getGroupMembers(groupId: string): Promise<GroupMember[] | ApiError>;
  joinGroup(groupId: string, userId: string): Promise<void | ApiError>;
  leaveGroup(groupId: string, userId: string): Promise<void | ApiError>;
  getGroupsForUser(userId: string): Promise<Group[] | ApiError>;

  // Group admins
  getGroupAdmins(groupId: string): Promise<GroupAdmin[] | ApiError>;

  // App roles (Super Admin, Admin)
  isSuperAdmin(userId: string): Promise<boolean | ApiError>;
  isAdmin(userId: string): Promise<boolean | ApiError>;
  getGroupsWhereUserIsAdmin(userId: string): Promise<Group[] | ApiError>;
  assignAdmin(userId: string, assignedByUserId: string): Promise<void | ApiError>;
  revokeAdmin(userId: string): Promise<void | ApiError>;
  /** Look up user's UUID by email via RPC. Returns null if no user found. */
  getUserIdByEmail(email: string): Promise<string | null | ApiError>;
}
