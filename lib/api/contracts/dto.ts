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

/** Group membership. From group_members table. Optional profile fields when enriched. */
export interface GroupMember {
  userId: string;
  groupId: string;
  joinedAt?: string;
  displayName?: string;
  avatarUrl?: string;
}

/** Group admin (creator or assigned). From group_admins table. */
export interface GroupAdmin {
  userId: string;
  groupId: string;
  assignedAt?: string;
}

/** Group discussion post. From group_discussions table. @deprecated Use Discussion/DiscussionPost for Reddit-style topics. */
export interface GroupDiscussion {
  id: string;
  groupId: string;
  userId: string;
  body: string;
  createdAt: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
}

/** Input for creating a group discussion. @deprecated Use CreateDiscussionInput for Reddit-style topics. */
export interface CreateGroupDiscussionInput {
  body: string;
}

/** Reddit-style discussion topic. From discussions table. */
export interface Discussion {
  id: string;
  groupId: string;
  userId: string;
  title: string;
  body: string;
  createdAt: string;
  /** When the discussion was last edited. If present and different from createdAt, show "[edited]". */
  updatedAt?: string;
  postCount?: number;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  groupName?: string;
}

/** Input for creating a discussion (topic). */
export interface CreateDiscussionInput {
  title: string;
  body: string;
}

/** Input for updating a discussion (partial). */
export interface UpdateDiscussionInput {
  title?: string;
  body?: string;
}

/** Reaction type on a discussion post reply. */
export type PostReactionType = 'prayer' | 'laugh' | 'thumbs_up';

/** Reaction counts per type for a discussion post. */
export interface PostReactionCounts {
  prayer: number;
  laugh: number;
  thumbsUp: number;
}

/** Who gave which reaction on a post. */
export interface PostReactionDetail {
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  reactionType: PostReactionType;
}

/** Reply to a discussion. From discussion_posts table. */
export interface DiscussionPost {
  id: string;
  discussionId: string;
  userId: string;
  body: string;
  createdAt: string;
  /** When the post was last edited. If present and different from createdAt, show "[edited]". */
  updatedAt?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  /** Parent post id when replying to a reply. */
  parentPostId?: string;
  /** Public URLs of attached images. */
  imageUrls?: string[];
  /** Counts per reaction type. */
  reactionCounts?: PostReactionCounts;
  /** Reaction types the current user has on this post (when userId provided to fetch). */
  userReactionTypes?: PostReactionType[];
}

/** Input for creating a discussion post (reply). */
export interface CreateDiscussionPostInput {
  body: string;
  /** Public URLs of attached images (must be uploaded first via uploadDiscussionPostImage). */
  imageUrls?: string[];
  /** Parent post id when replying to a reply. */
  parentPostId?: string;
}

/** Friend request status. */
export type FriendRequestStatus = 'pending' | 'accepted' | 'declined';

/** Friend request between two users. From friend_requests table. */
export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: FriendRequestStatus;
  createdAt: string;
  updatedAt: string;
  senderDisplayName?: string;
  senderAvatarUrl?: string;
  receiverDisplayName?: string;
  receiverAvatarUrl?: string;
}

/** Input for updating a discussion post (reply). Partial. */
export interface UpdateDiscussionPostInput {
  body?: string;
  /** Public URLs of attached images (must be uploaded first via uploadDiscussionPostImage). */
  imageUrls?: string[];
}

// --- Chats ---

/** Chat (DM or group chat). */
export interface Chat {
  id: string;
  createdByUserId: string;
  name?: string;
  description?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt?: string;
  /** Last message preview when listing chats. */
  lastMessagePreview?: string;
  /** Last message timestamp. */
  lastMessageAt?: string;
  /** Member count. */
  memberCount?: number;
  /** Members with displayName, avatarUrl (when enriched, e.g. getChat). */
  members?: ChatMember[];
  /** Comma-separated display names of other participants (for list view when no name). */
  participantDisplayNames?: string;
}

/** Chat member. */
export interface ChatMember {
  userId: string;
  chatId: string;
  joinedAt?: string;
  displayName?: string;
  avatarUrl?: string;
}

/** Input for creating a chat. */
export interface CreateChatInput {
  name?: string;
  description?: string;
  imageUrl?: string;
  memberUserIds: string[];
}

/** Input for updating a chat (partial). */
export interface UpdateChatInput {
  name?: string;
  description?: string;
  imageUrl?: string;
}

/** Chat message. Same shape as DiscussionPost for component reuse. */
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  parentMessageId?: string;
  imageUrls?: string[];
  reactionCounts?: PostReactionCounts;
  userReactionTypes?: PostReactionType[];
}

/** Input for creating a chat message. */
export interface CreateChatMessageInput {
  body: string;
  imageUrls?: string[];
  parentMessageId?: string;
}

/** Input for updating a chat message (partial). */
export interface UpdateChatMessageInput {
  body?: string;
  imageUrls?: string[];
}

/** Chat folder (user-defined organization). */
export interface ChatFolder {
  id: string;
  userId: string;
  name: string;
  createdAt?: string;
}

/** Chat folder item (chat in a folder). */
export interface ChatFolderItem {
  folderId: string;
  chatId: string;
  createdAt?: string;
}
