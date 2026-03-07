/**
 * React Query hooks wrapping api.data calls. All server state flows through these hooks.
 * Keeps the facade as the boundary; hooks add caching, deduplication, and invalidation.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, isApiError } from '@/lib/api';
import { queryKeys } from '@/lib/api/queryKeys';
import type {
  CreateGroupInput,
  DiscussionPost,
  GroupType,
  NotificationPreferencesUpdates,
  OnboardingProfileData,
  PostReactionType,
  ProfileUpdates,
  UpdateGroupInput,
} from '@/lib/api';

/** Throws on ApiError so useQuery gets error state. Returns data otherwise. */
async function queryFn<T>(promise: Promise<T | import('@/lib/api').ApiError>): Promise<T> {
  const result = await promise;
  if (isApiError(result)) {
    throw result;
  }
  return result;
}

// --- Profile ---

export function useProfileQuery(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.profile(userId ?? ''),
    queryFn: () => queryFn(api.data.getProfile(userId!)),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useUpdateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: ProfileUpdates }) =>
      queryFn(api.data.updateProfile(userId, updates)),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

export function useCreateProfileMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, data }: { userId: string; data: OnboardingProfileData }) =>
      queryFn(api.data.createProfile(userId, data)),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

export function useUploadProfileImageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      imageUri,
      base64Data,
    }: {
      userId: string;
      imageUri: string;
      base64Data?: string | null;
    }) => queryFn(api.data.uploadProfileImage(userId, imageUri, base64Data)) as Promise<string>,
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.profile(userId) });
    },
  });
}

// --- Notification preferences ---

export function useNotificationPreferencesQuery(
  userId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.notificationPreferences(userId ?? ''),
    queryFn: () => queryFn(api.data.getNotificationPreferences(userId!)),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: NotificationPreferencesUpdates;
    }) => queryFn(api.data.updateNotificationPreferences(userId, updates)),
    onSuccess: (_, { userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.notificationPreferences(userId) });
    },
  });
}

// --- Groups ---

export function useGroupsQuery(params?: { type?: GroupType; search?: string; enabled?: boolean }) {
  const { type, search, enabled = true } = params ?? {};
  return useQuery({
    queryKey: queryKeys.groups({ type, search: search?.trim() || undefined }),
    queryFn: () =>
      queryFn(api.data.getGroups({ type, search: search?.trim() || undefined })) as Promise<
        import('@/lib/api').Group[]
      >,
    enabled,
  });
}

export function useGroupQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.group(id ?? ''),
    queryFn: () => queryFn(api.data.getGroup(id!)) as Promise<import('@/lib/api').Group>,
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useGroupsForUserQuery(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.groupsForUser(userId ?? ''),
    queryFn: () =>
      queryFn(api.data.getGroupsForUser(userId!)) as Promise<import('@/lib/api').Group[]>,
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useGroupMembersQuery(groupId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.groupMembers(groupId ?? ''),
    queryFn: () =>
      queryFn(api.data.getGroupMembers(groupId!)) as Promise<import('@/lib/api').GroupMember[]>,
    enabled: !!groupId && (options?.enabled ?? true),
  });
}

// --- Friendships ---

export function useFriendIdsQuery(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.friendIds(userId ?? ''),
    queryFn: () => queryFn(api.data.getFriendIds(userId!)) as Promise<string[]>,
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useAreFriendsQuery(
  userId: string | undefined,
  targetUserId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.areFriends(userId ?? '', targetUserId ?? ''),
    queryFn: () => queryFn(api.data.areFriends(userId!, targetUserId!)) as Promise<boolean>,
    enabled: !!userId && !!targetUserId && userId !== targetUserId && (options?.enabled ?? true),
  });
}

export function useAddFriendMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, friendId }: { userId: string; friendId: string }) =>
      queryFn(api.data.addFriend(userId, friendId)),
    onSuccess: (_, { userId, friendId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.friendIds(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.friendIds(friendId) });
      qc.invalidateQueries({ queryKey: queryKeys.areFriends(userId, friendId) });
    },
  });
}

export function useRemoveFriendMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, friendId }: { userId: string; friendId: string }) =>
      queryFn(api.data.removeFriend(userId, friendId)),
    onSuccess: (_, { userId, friendId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.friendIds(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.friendIds(friendId) });
      qc.invalidateQueries({ queryKey: queryKeys.areFriends(userId, friendId) });
    },
  });
}

// --- Friend requests ---

export function useFriendRequestBetweenQuery(
  userId: string | undefined,
  targetUserId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.friendRequestBetween(userId ?? '', targetUserId ?? ''),
    queryFn: () =>
      queryFn(
        api.data.getFriendRequestBetween(userId!, targetUserId!)
      ) as Promise<import('@/lib/api').FriendRequest | null>,
    enabled: !!userId && !!targetUserId && userId !== targetUserId && (options?.enabled ?? true),
  });
}

export function useReceivedFriendRequestsQuery(
  userId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.receivedFriendRequests(userId ?? ''),
    queryFn: () =>
      queryFn(api.data.getReceivedFriendRequests(userId!)) as Promise<
        import('@/lib/api').FriendRequest[]
      >,
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function usePendingFriendRequestCountQuery(
  userId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.pendingFriendRequestCount(userId ?? ''),
    queryFn: () => queryFn(api.data.getPendingFriendRequestCount(userId!)) as Promise<number>,
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useSendFriendRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ senderId, receiverId }: { senderId: string; receiverId: string }) =>
      queryFn(api.data.sendFriendRequest(senderId, receiverId)) as Promise<
        import('@/lib/api').FriendRequest
      >,
    onSuccess: (_, { senderId, receiverId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.friendRequestBetween(senderId, receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.receivedFriendRequests(receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.pendingFriendRequestCount(receiverId) });
    },
  });
}

export function useCancelFriendRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      senderId,
      receiverId,
    }: {
      requestId: string;
      senderId: string;
      receiverId: string;
    }) => queryFn(api.data.cancelFriendRequest(requestId)),
    onSuccess: (_, { senderId, receiverId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.friendRequestBetween(senderId, receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.receivedFriendRequests(receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.pendingFriendRequestCount(receiverId) });
    },
  });
}

export function useAcceptFriendRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      receiverId,
    }: {
      requestId: string;
      receiverId: string;
      senderId: string;
    }) => queryFn(api.data.acceptFriendRequest(requestId, receiverId)),
    onSuccess: (_, { senderId, receiverId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.friendRequestBetween(senderId, receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.receivedFriendRequests(receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.pendingFriendRequestCount(receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.friendIds(senderId) });
      qc.invalidateQueries({ queryKey: queryKeys.friendIds(receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.areFriends(senderId, receiverId) });
    },
  });
}

export function useDeclineFriendRequestMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      requestId,
      receiverId,
    }: {
      requestId: string;
      receiverId: string;
      senderId: string;
    }) => queryFn(api.data.declineFriendRequest(requestId, receiverId)),
    onSuccess: (_, { senderId, receiverId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.friendRequestBetween(senderId, receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.receivedFriendRequests(receiverId) });
      qc.invalidateQueries({ queryKey: queryKeys.pendingFriendRequestCount(receiverId) });
    },
  });
}

export function useGroupAdminsQuery(groupId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.groupAdmins(groupId ?? ''),
    queryFn: () =>
      queryFn(api.data.getGroupAdmins(groupId!)) as Promise<import('@/lib/api').GroupAdmin[]>,
    enabled: !!groupId && (options?.enabled ?? true),
  });
}

export function useIsAdminQuery(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.isAdmin(userId ?? ''),
    queryFn: () => queryFn(api.data.isAdmin(userId!)) as Promise<boolean>,
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useIsSuperAdminQuery(userId: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.isSuperAdmin(userId ?? ''),
    queryFn: () => queryFn(api.data.isSuperAdmin(userId!)) as Promise<boolean>,
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useGroupDiscussionsQuery(
  groupId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.groupDiscussions(groupId ?? ''),
    queryFn: () =>
      queryFn(api.data.getGroupDiscussions(groupId!)) as Promise<
        import('@/lib/api').GroupDiscussion[]
      >,
    enabled: !!groupId && (options?.enabled ?? true),
  });
}

export function useCreateGroupDiscussionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      input,
    }: {
      groupId: string;
      userId: string;
      input: import('@/lib/api').CreateGroupDiscussionInput;
    }) =>
      queryFn(api.data.createGroupDiscussion(groupId, userId, input)) as Promise<
        import('@/lib/api').GroupDiscussion
      >,
    onSuccess: (_, { groupId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groupDiscussions(groupId) });
    },
  });
}

// --- Reddit-style discussions ---

export function useDiscussionsQuery(params?: { groupId?: string; enabled?: boolean }) {
  const { groupId, enabled = true } = params ?? {};
  return useQuery({
    queryKey: queryKeys.discussions({ groupId }),
    queryFn: () =>
      queryFn(api.data.getDiscussions({ groupId })) as Promise<import('@/lib/api').Discussion[]>,
    enabled,
  });
}

export function useDiscussionQuery(id: string | undefined, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.discussion(id ?? ''),
    queryFn: () => queryFn(api.data.getDiscussion(id!)) as Promise<import('@/lib/api').Discussion>,
    enabled: !!id && (options?.enabled ?? true),
  });
}

export function useDiscussionPostsQuery(
  discussionId: string | undefined,
  options?: { enabled?: boolean; userId?: string }
) {
  const { enabled = true, userId } = options ?? {};
  return useQuery({
    queryKey: queryKeys.discussionPosts(discussionId ?? '', userId),
    queryFn: () =>
      queryFn(api.data.getDiscussionPosts(discussionId!, { userId })) as Promise<
        import('@/lib/api').DiscussionPost[]
      >,
    enabled: !!discussionId && enabled,
  });
}

export function useCreateDiscussionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      groupId,
      userId,
      input,
    }: {
      groupId: string;
      userId: string;
      input: import('@/lib/api').CreateDiscussionInput;
    }) =>
      queryFn(api.data.createDiscussion(groupId, userId, input)) as Promise<
        import('@/lib/api').Discussion
      >,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useUpdateDiscussionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      discussionId,
      params,
    }: {
      discussionId: string;
      params: import('@/lib/api').UpdateDiscussionInput;
    }) =>
      queryFn(api.data.updateDiscussion(discussionId, params)) as Promise<
        import('@/lib/api').Discussion
      >,
    onSuccess: (_, { discussionId }) => {
      qc.invalidateQueries({ queryKey: ['discussion', discussionId] });
      qc.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useDeleteDiscussionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ discussionId }: { discussionId: string }) =>
      queryFn(api.data.deleteDiscussion(discussionId)),
    onSuccess: (_, { discussionId }) => {
      qc.invalidateQueries({ queryKey: ['discussion', discussionId] });
      qc.invalidateQueries({ queryKey: ['discussions'] });
    },
  });
}

export function useCreateDiscussionPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      discussionId,
      userId,
      input,
    }: {
      discussionId: string;
      userId: string;
      input: import('@/lib/api').CreateDiscussionPostInput;
    }) =>
      queryFn(api.data.createDiscussionPost(discussionId, userId, input)) as Promise<
        import('@/lib/api').DiscussionPost
      >,
    onSuccess: (_, { discussionId }) => {
      qc.invalidateQueries({
        predicate: (q) => q.queryKey[0] === 'discussionPosts' && q.queryKey[1] === discussionId,
      });
    },
  });
}

export function useUpdateDiscussionPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      userId,
      input,
    }: {
      postId: string;
      userId: string;
      input: import('@/lib/api').UpdateDiscussionPostInput;
    }) =>
      queryFn(api.data.updateDiscussionPost(postId, userId, input)) as Promise<
        import('@/lib/api').DiscussionPost
      >,
    onSuccess: (updatedPost) => {
      qc.invalidateQueries({
        predicate: (q) =>
          q.queryKey[0] === 'discussionPosts' && q.queryKey[1] === updatedPost.discussionId,
      });
    },
  });
}

function updatePostReaction(
  post: DiscussionPost,
  reactionType: PostReactionType,
  delta: 1 | -1,
  userId: string
): DiscussionPost {
  const counts = { ...(post.reactionCounts ?? { prayer: 0, laugh: 0, thumbsUp: 0 }) };
  const userReactions = [...(post.userReactionTypes ?? [])];
  if (delta === 1) {
    const prev = userReactions[0];
    if (prev) {
      const prevKey = prev === 'thumbs_up' ? 'thumbsUp' : prev;
      counts[prevKey] = Math.max(0, counts[prevKey] - 1);
    }
    const key = reactionType === 'thumbs_up' ? 'thumbsUp' : reactionType;
    counts[key] = (counts[key] ?? 0) + 1;
    return { ...post, reactionCounts: counts, userReactionTypes: [reactionType] };
  } else {
    const key = reactionType === 'thumbs_up' ? 'thumbsUp' : reactionType;
    counts[key] = Math.max(0, counts[key] - 1);
    const i = userReactions.indexOf(reactionType);
    if (i >= 0) userReactions.splice(i, 1);
    return { ...post, reactionCounts: counts, userReactionTypes: userReactions };
  }
}

export function useReactToPostMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      discussionId,
      userId,
      reactionType,
    }: {
      postId: string;
      discussionId: string;
      userId: string;
      reactionType: PostReactionType;
    }) => queryFn(api.data.reactToDiscussionPost(postId, userId, reactionType)) as Promise<void>,
    onMutate: async ({ postId, discussionId, userId, reactionType }) => {
      await qc.cancelQueries({ queryKey: queryKeys.discussionPosts(discussionId, userId) });
      const previous = qc.getQueryData<DiscussionPost[]>(
        queryKeys.discussionPosts(discussionId, userId)
      );
      qc.setQueryData<DiscussionPost[]>(
        queryKeys.discussionPosts(discussionId, userId),
        (old = []) =>
          old.map((p) => (p.id === postId ? updatePostReaction(p, reactionType, 1, userId) : p))
      );
      return { previous };
    },
    onError: (_, { discussionId, userId }, context) => {
      if (context?.previous != null) {
        qc.setQueryData(queryKeys.discussionPosts(discussionId, userId), context.previous);
      }
    },
    onSettled: (_, __, { postId, discussionId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.discussionPosts(discussionId, userId) });
      qc.invalidateQueries({ queryKey: queryKeys.discussionPostReactions(postId) });
    },
  });
}

export function useDiscussionPostReactionsQuery(
  postId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: queryKeys.discussionPostReactions(postId ?? ''),
    queryFn: () =>
      queryFn(api.data.getDiscussionPostReactions(postId!)) as Promise<
        import('@/lib/api').PostReactionDetail[]
      >,
    enabled: !!postId && (options?.enabled ?? true),
  });
}

export function useRemovePostReactionMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      postId,
      discussionId,
      userId,
      reactionType,
    }: {
      postId: string;
      discussionId: string;
      userId: string;
      reactionType: PostReactionType;
    }) =>
      queryFn(api.data.removeDiscussionPostReaction(postId, userId, reactionType)) as Promise<void>,
    onMutate: async ({ postId, discussionId, userId, reactionType }) => {
      await qc.cancelQueries({ queryKey: queryKeys.discussionPosts(discussionId, userId) });
      const previous = qc.getQueryData<DiscussionPost[]>(
        queryKeys.discussionPosts(discussionId, userId)
      );
      qc.setQueryData<DiscussionPost[]>(
        queryKeys.discussionPosts(discussionId, userId),
        (old = []) =>
          old.map((p) => (p.id === postId ? updatePostReaction(p, reactionType, -1, userId) : p))
      );
      return { previous };
    },
    onError: (_, { discussionId, userId }, context) => {
      if (context?.previous != null) {
        qc.setQueryData(queryKeys.discussionPosts(discussionId, userId), context.previous);
      }
    },
    onSettled: (_, __, { postId, discussionId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.discussionPosts(discussionId, userId) });
      qc.invalidateQueries({ queryKey: queryKeys.discussionPostReactions(postId) });
    },
  });
}

export function useJoinGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) =>
      queryFn(api.data.joinGroup(groupId, userId)),
    onSuccess: (_, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groupsForUser(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
    },
  });
}

export function useLeaveGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, userId }: { groupId: string; userId: string }) =>
      queryFn(api.data.leaveGroup(groupId, userId)),
    onSuccess: (_, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groupsForUser(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groupMembers(groupId) });
    },
  });
}

export function useCreateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      params,
      createdByUserId,
    }: {
      params: CreateGroupInput;
      createdByUserId: string;
    }) =>
      queryFn(api.data.createGroup(params, createdByUserId)) as Promise<import('@/lib/api').Group>,
    onSuccess: (_, { createdByUserId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.groups() });
      qc.invalidateQueries({ queryKey: queryKeys.groupsForUser(createdByUserId) });
    },
  });
}

export function useUpdateGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId, params }: { groupId: string; params: UpdateGroupInput }) =>
      queryFn(api.data.updateGroup(groupId, params)) as Promise<import('@/lib/api').Group>,
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: queryKeys.group(updated.id) });
      qc.invalidateQueries({ queryKey: queryKeys.groups() });
      qc.invalidateQueries({ queryKey: queryKeys.groupsForUser(updated.createdByUserId) });
    },
  });
}

export function useDeleteGroupMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ groupId }: { groupId: string }) =>
      queryFn(api.data.deleteGroup(groupId)) as Promise<void>,
    onSuccess: (_, { groupId, userId }) => {
      qc.invalidateQueries({ queryKey: queryKeys.group(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups() });
      if (userId) {
        qc.invalidateQueries({ queryKey: queryKeys.groupsForUser(userId) });
      }
    },
  });
}

export function useUploadGroupBannerImageMutation() {
  return useMutation({
    mutationFn: async ({
      userId,
      imageUri,
      base64Data,
    }: {
      userId: string;
      imageUri: string;
      base64Data?: string | null;
    }) => queryFn(api.data.uploadGroupBannerImage(userId, imageUri, base64Data)) as Promise<string>,
  });
}

export function useUploadDiscussionPostImageMutation() {
  return useMutation({
    mutationFn: async ({
      userId,
      imageUri,
      base64Data,
    }: {
      userId: string;
      imageUri: string;
      base64Data?: string | null;
    }) =>
      queryFn(api.data.uploadDiscussionPostImage(userId, imageUri, base64Data)) as Promise<string>,
  });
}
