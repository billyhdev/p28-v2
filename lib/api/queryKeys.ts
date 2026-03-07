/**
 * React Query key factory. Centralizes all query keys for consistency and invalidation.
 */
export const queryKeys = {
  profile: (userId: string) => ['profile', userId] as const,
  notificationPreferences: (userId: string) => ['notificationPreferences', userId] as const,
  groups: (params?: { type?: 'forum' | 'ministry'; search?: string }) =>
    ['groups', params ?? {}] as const,
  group: (id: string) => ['group', id] as const,
  groupMembers: (groupId: string) => ['groupMembers', groupId] as const,
  groupDiscussions: (groupId: string) => ['groupDiscussions', groupId] as const,
  discussions: (params?: { groupId?: string }) => ['discussions', params ?? {}] as const,
  discussion: (id: string) => ['discussion', id] as const,
  discussionPosts: (discussionId: string, userId?: string) =>
    ['discussionPosts', discussionId, userId ?? null] as const,
  discussionPostReactions: (postId: string) => ['discussionPostReactions', postId] as const,
  groupsForUser: (userId: string) => ['groupsForUser', userId] as const,
  groupAdmins: (groupId: string) => ['groupAdmins', groupId] as const,
  isAdmin: (userId: string) => ['isAdmin', userId] as const,
  isSuperAdmin: (userId: string) => ['isSuperAdmin', userId] as const,
  friendIds: (userId: string) => ['friendIds', userId] as const,
  areFriends: (userId: string, targetUserId: string) =>
    ['areFriends', userId, targetUserId] as const,
  friendRequestBetween: (userId: string, targetUserId: string) =>
    ['friendRequestBetween', userId, targetUserId] as const,
  receivedFriendRequests: (userId: string) => ['receivedFriendRequests', userId] as const,
  pendingFriendRequestCount: (userId: string) => ['pendingFriendRequestCount', userId] as const,
};
