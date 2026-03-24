/**
 * Backend facade. App and components import only from here (e.g. api.auth.getSession()).
 * Do not import from lib/api/adapters/ or @supabase/* outside the adapter layer.
 */
import * as supabaseAdapter from './adapters/supabase';

export const auth = supabaseAdapter.auth;
export const data = supabaseAdapter.data;
export const realtime = supabaseAdapter.realtime;

/** Facade object for app usage: api.auth, api.data, api.realtime */
export const api = { auth, data, realtime };

export { getUserFacingError } from '../errors';

export { isApiError } from './contracts';
export type {
  AuthContract,
  AuthStateListener,
  DataContract,
  RealtimeContract,
  RealtimeChannelId,
  RealtimeHandlers,
  ApiError,
  User,
  Session,
  Profile,
  ProfileUpdates,
  OnboardingProfileData,
  Announcement,
  AnnouncementStatus,
  NotificationPreferences,
  NotificationPreferencesUpdates,
  CreateAnnouncementInput,
  CreateGroupEventInput,
  EventRsvpAttendee,
  EventRsvpResponse,
  Group,
  GroupType,
  CreateGroupInput,
  UpdateGroupEventInput,
  UpdateGroupInput,
  GroupMember,
  GroupMemberSettings,
  GroupMemberSettingsUpdates,
  GroupAdmin,
  GroupEvent,
  GroupEventStatus,
  Discussion,
  CreateDiscussionInput,
  UpdateDiscussionInput,
  DiscussionPost,
  CreateDiscussionPostInput,
  UpdateDiscussionPostInput,
  PostReactionCounts,
  PostReactionDetail,
  PostReactionType,
  FriendRequest,
  FriendRequestStatus,
  Chat,
  ChatMember,
  ChatMessage,
  ChatFolder,
  ChatFolderItem,
  CreateChatInput,
  UpdateChatInput,
  CreateChatMessageInput,
  UpdateChatMessageInput,
  PushToken,
  InAppNotification,
  InAppNotificationKind,
  MarkInAppNotificationsReadInput,
} from './contracts';
