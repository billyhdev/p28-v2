import type { ApiError } from './errors';
import type {
  Chat,
  ChatFolder,
  ChatFolderItem,
  ChatMember,
  ChatMessage,
  CreateChatInput,
  CreateChatMessageInput,
  CreateDiscussionInput,
  CreateDiscussionPostInput,
  CreateGroupDiscussionInput,
  CreateGroupInput,
  Discussion,
  DiscussionPost,
  FriendRequest,
  Group,
  PostReactionDetail,
  GroupAdmin,
  GroupDiscussion,
  GroupMember,
  NotificationPreferences,
  NotificationPreferencesUpdates,
  OnboardingProfileData,
  PostReactionType,
  Profile,
  ProfileUpdates,
  UpdateChatInput,
  UpdateChatMessageInput,
  UpdateDiscussionInput,
  UpdateDiscussionPostInput,
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
  /** Upload group banner image. Returns public URL. Used when creating/editing groups. */
  uploadGroupBannerImage(
    userId: string,
    imageUri: string,
    base64Data?: string | null
  ): Promise<string | ApiError>;
  /** Upload discussion post image. Returns public URL. Used when replying with attachments. */
  uploadDiscussionPostImage(
    userId: string,
    imageUri: string,
    base64Data?: string | null
  ): Promise<string | ApiError>;
  /** Upload chat avatar or chat message image. Returns public URL. */
  uploadChatImage(
    userId: string,
    imageUri: string,
    base64Data?: string | null,
    options?: { chatId?: string }
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
  deleteGroup(id: string): Promise<void | ApiError>;

  // Group membership
  getGroupMembers(groupId: string): Promise<GroupMember[] | ApiError>;
  joinGroup(groupId: string, userId: string): Promise<void | ApiError>;
  leaveGroup(groupId: string, userId: string): Promise<void | ApiError>;
  getGroupsForUser(userId: string): Promise<Group[] | ApiError>;

  // Friendships
  getFriendIds(userId: string): Promise<string[] | ApiError>;
  areFriends(userId: string, targetUserId: string): Promise<boolean | ApiError>;
  addFriend(userId: string, friendId: string): Promise<void | ApiError>;
  removeFriend(userId: string, friendId: string): Promise<void | ApiError>;

  // Friend requests
  sendFriendRequest(senderId: string, receiverId: string): Promise<FriendRequest | ApiError>;
  cancelFriendRequest(requestId: string): Promise<void | ApiError>;
  acceptFriendRequest(requestId: string, receiverId: string): Promise<void | ApiError>;
  declineFriendRequest(requestId: string, receiverId: string): Promise<void | ApiError>;
  getReceivedFriendRequests(userId: string): Promise<FriendRequest[] | ApiError>;
  getSentFriendRequests(userId: string): Promise<FriendRequest[] | ApiError>;
  getFriendRequestBetween(
    userId: string,
    targetUserId: string
  ): Promise<FriendRequest | null | ApiError>;
  getPendingFriendRequestCount(userId: string): Promise<number | ApiError>;

  // Group admins
  getGroupAdmins(groupId: string): Promise<GroupAdmin[] | ApiError>;

  // Group discussions
  getGroupDiscussions(groupId: string): Promise<GroupDiscussion[] | ApiError>;
  createGroupDiscussion(
    groupId: string,
    userId: string,
    input: CreateGroupDiscussionInput
  ): Promise<GroupDiscussion | ApiError>;

  // Reddit-style discussions (topics + replies)
  getDiscussions(params?: { groupId?: string }): Promise<Discussion[] | ApiError>;
  getDiscussion(id: string): Promise<Discussion | ApiError>;
  createDiscussion(
    groupId: string,
    userId: string,
    input: CreateDiscussionInput
  ): Promise<Discussion | ApiError>;
  updateDiscussion(id: string, params: UpdateDiscussionInput): Promise<Discussion | ApiError>;
  deleteDiscussion(id: string): Promise<void | ApiError>;
  getDiscussionPosts(
    discussionId: string,
    options?: { userId?: string }
  ): Promise<DiscussionPost[] | ApiError>;
  createDiscussionPost(
    discussionId: string,
    userId: string,
    input: CreateDiscussionPostInput
  ): Promise<DiscussionPost | ApiError>;
  updateDiscussionPost(
    postId: string,
    userId: string,
    input: UpdateDiscussionPostInput
  ): Promise<DiscussionPost | ApiError>;
  /** Add or replace reaction on a discussion post. One reaction per user per post. */
  reactToDiscussionPost(
    postId: string,
    userId: string,
    reactionType: PostReactionType
  ): Promise<void | ApiError>;
  /** Remove reaction from a discussion post. */
  removeDiscussionPostReaction(
    postId: string,
    userId: string,
    reactionType: PostReactionType
  ): Promise<void | ApiError>;
  /** Get who gave which reaction on a post. */
  getDiscussionPostReactions(postId: string): Promise<PostReactionDetail[] | ApiError>;

  // Chats
  getChatsForUser(userId: string, options?: { folderId?: string }): Promise<Chat[] | ApiError>;
  getChat(id: string): Promise<Chat | ApiError>;
  findExisting1on1Chat(userId: string, otherUserId: string): Promise<Chat | null | ApiError>;
  /** Find a chat with exactly these members (current user + memberUserIds). Works for 1-on-1 and group chats. */
  findExistingChatByMembers(
    userId: string,
    memberUserIds: string[]
  ): Promise<Chat | null | ApiError>;
  createChat(userId: string, input: CreateChatInput): Promise<Chat | ApiError>;
  addChatMembers(
    chatId: string,
    addedByUserId: string,
    memberUserIds: string[]
  ): Promise<void | ApiError>;
  updateChat(id: string, input: UpdateChatInput): Promise<Chat | ApiError>;
  getChatMessages(chatId: string, options?: { userId?: string }): Promise<ChatMessage[] | ApiError>;
  createChatMessage(
    chatId: string,
    userId: string,
    input: CreateChatMessageInput
  ): Promise<ChatMessage | ApiError>;
  updateChatMessage(
    messageId: string,
    userId: string,
    input: UpdateChatMessageInput
  ): Promise<ChatMessage | ApiError>;
  reactToChatMessage(
    messageId: string,
    chatId: string,
    userId: string,
    reactionType: PostReactionType
  ): Promise<void | ApiError>;
  removeChatMessageReaction(
    messageId: string,
    chatId: string,
    userId: string,
    reactionType: PostReactionType
  ): Promise<void | ApiError>;
  getChatMessageReactions(messageId: string): Promise<PostReactionDetail[] | ApiError>;
  getChatFolders(userId: string): Promise<ChatFolder[] | ApiError>;
  createChatFolder(userId: string, name: string): Promise<ChatFolder | ApiError>;
  updateChatFolder(folderId: string, userId: string, name: string): Promise<ChatFolder | ApiError>;
  deleteChatFolder(folderId: string, userId: string): Promise<void | ApiError>;
  getChatFolderItems(folderId: string): Promise<ChatFolderItem[] | ApiError>;
  addChatToFolder(
    folderId: string,
    chatId: string,
    userId: string
  ): Promise<ChatFolderItem | ApiError>;
  removeChatFromFolder(folderId: string, chatId: string, userId: string): Promise<void | ApiError>;
  /** Get profiles for multiple user IDs. Used for friend picker. */
  getProfiles(userIds: string[]): Promise<Profile[] | ApiError>;
  /** Search profiles by display name, first name, or last name. Excludes excludeUserId (typically current user). */
  searchProfiles(search: string, excludeUserId: string): Promise<Profile[] | ApiError>;

  // App roles (Super Admin, Admin)
  isSuperAdmin(userId: string): Promise<boolean | ApiError>;
  isAdmin(userId: string): Promise<boolean | ApiError>;
  getGroupsWhereUserIsAdmin(userId: string): Promise<Group[] | ApiError>;
  assignAdmin(userId: string, assignedByUserId: string): Promise<void | ApiError>;
  revokeAdmin(userId: string): Promise<void | ApiError>;
  /** Look up user's UUID by email via RPC. Returns null if no user found. */
  getUserIdByEmail(email: string): Promise<string | null | ApiError>;
}
