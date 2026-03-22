/**
 * Shared types for message/post display. DiscussionPost and ChatMessage both satisfy this.
 */
import type { PostReactionCounts, PostReactionType } from '@/lib/api';

export interface MessageLike {
  id: string;
  userId: string;
  body: string;
  createdAt: string;
  updatedAt?: string;
  authorDisplayName?: string;
  authorAvatarUrl?: string;
  imageUrls?: string[];
  reactionCounts?: PostReactionCounts;
  userReactionTypes?: PostReactionType[];
}

export interface ParentMessageLike {
  body?: string;
  authorDisplayName?: string;
}

export { type PostReactionType } from '@/lib/api';
