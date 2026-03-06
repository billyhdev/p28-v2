import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataContract } from '../../contracts';
import type { ApiError } from '../../contracts/errors';
import { isApiError } from '../../contracts/guards';
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
} from '../../contracts/dto';

function toApiError(err: unknown): ApiError {
  if (err && typeof err === 'object') {
    const e = err as Error & { code?: string; message?: string };
    const code = e.code;
    if (code === 'PGRST116') {
      return { message: 'Resource not found', code: 'NOT_FOUND' };
    }
    let message =
      typeof e.message === 'string' ? e.message : code ? String(code) : 'An error occurred';
    if (code === '23505') {
      if (message.includes('group_members_pkey')) {
        return {
          message: 'You have already joined this group',
          code: 'ALREADY_EXISTS',
        };
      } else if (message.includes('group_admins_pkey')) {
        return {
          message: 'User is already an admin for this group',
          code: 'ALREADY_EXISTS',
        };
      } else if (message.includes('app_roles_pkey')) {
        return {
          message: 'User already has an app role',
          code: 'ALREADY_EXISTS',
        };
      }
    }
    return { message, code };
  }
  return { message: String(err ?? 'An error occurred') };
}

/** Supabase storage URL path segment for the avatars bucket (public or authenticated). */
const AVATARS_BUCKET_SEGMENT = '/avatars/';

/** Infer image extension/content type from URI (e.g. .png -> image/png). */
function contentTypeFromUri(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes('.png')) return 'image/png';
  if (lower.includes('.gif')) return 'image/gif';
  if (lower.includes('.webp')) return 'image/webp';
  return 'image/jpeg';
}

/** Decode base64 image data to ArrayBuffer. Use this for upload in React Native (Blob from ArrayBuffer is not supported). */
function base64ToArrayBuffer(
  base64: string,
  contentType: string = 'image/jpeg'
): { body: ArrayBuffer; contentType: string } {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { body: bytes.buffer, contentType };
}

/** Result type for image read: body is ArrayBuffer or Blob (Supabase accepts both). */
type ImageUploadBody = { body: ArrayBuffer | Blob; contentType: string };

/**
 * Reads an image file from a local URI. Uses expo-file-system/legacy on React Native when available;
 * returns ArrayBuffer to avoid Blob-from-ArrayBuffer in RN. Falls back to fetch for web/Node tests.
 */
async function readImageFile(imageUri: string): Promise<ImageUploadBody> {
  const contentType = contentTypeFromUri(imageUri);

  try {
    const LegacyFS = require('expo-file-system/legacy') as {
      readAsStringAsync?: (uri: string, options: { encoding: string }) => Promise<string>;
      EncodingType?: { Base64: string };
    };
    if (LegacyFS?.readAsStringAsync) {
      const encoding = LegacyFS.EncodingType?.Base64 ?? 'base64';
      const base64 = await LegacyFS.readAsStringAsync(imageUri, { encoding });
      const { body } = base64ToArrayBuffer(base64, contentType);
      return { body, contentType };
    }
  } catch {
    // Fall through to fetch (e.g. web or Node tests)
  }

  const response = await fetch(imageUri);
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }
  const blob = await response.blob();
  const type = blob.type || contentType;
  return { body: blob, contentType: type };
}

/**
 * Extracts storage path from a Supabase storage URL, or returns undefined.
 * Handles both public (e.g. .../object/public/avatars/[path]) and other URL shapes.
 */
function avatarPathFromPublicUrl(avatarUrl: string): string | undefined {
  const idx = avatarUrl.indexOf(AVATARS_BUCKET_SEGMENT);
  if (idx === -1) return undefined;
  const withQuery = avatarUrl.slice(idx + AVATARS_BUCKET_SEGMENT.length);
  const path = withQuery.split('?')[0]?.trim();
  return path || undefined;
}

/**
 * Resolves avatar URL to a signed URL so it works for private buckets. Returns the
 * original URL if resolution fails (e.g. not our storage URL, or signed URL error).
 */
async function resolveAvatarDisplayUrl(
  getClient: () => SupabaseClient,
  avatarUrl: string
): Promise<string> {
  const path = avatarPathFromPublicUrl(avatarUrl);
  if (!path) return avatarUrl;
  try {
    const { data, error } = await getClient()
      .storage.from('avatars')
      .createSignedUrl(path, 60 * 60); // 1 hour
    if (error || !data?.signedUrl) return avatarUrl;
    return data.signedUrl;
  } catch {
    return avatarUrl;
  }
}

function mapNotificationPrefsRow(row: {
  user_id: string;
  events_enabled: boolean;
  announcements_enabled: boolean;
  messages_enabled: boolean;
  updated_at?: string | null;
}): NotificationPreferences {
  return {
    userId: row.user_id,
    eventsEnabled: row.events_enabled ?? true,
    announcementsEnabled: row.announcements_enabled ?? true,
    messagesEnabled: row.messages_enabled ?? true,
    updatedAt: row.updated_at ?? undefined,
  };
}

type GroupRow = {
  id: string;
  type: string;
  name: string;
  description?: string | null;
  banner_image_url?: string | null;
  preferred_language?: string | null;
  country?: string | null;
  created_by_user_id: string;
  created_at?: string | null;
  updated_at?: string | null;
  group_members?: Array<{ count: number }>;
};

function mapGroupRow(row: GroupRow): Group {
  const memberCount =
    Array.isArray(row.group_members) && row.group_members[0]?.count != null
      ? row.group_members[0].count
      : undefined;
  return {
    id: row.id,
    type: row.type as 'forum' | 'ministry',
    name: row.name,
    description: row.description ?? undefined,
    bannerImageUrl: row.banner_image_url ?? undefined,
    preferredLanguage: row.preferred_language ?? 'en',
    country: row.country ?? 'Online',
    createdByUserId: row.created_by_user_id,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
    memberCount,
  };
}

function mapGroupMemberRow(row: {
  user_id: string;
  group_id: string;
  joined_at?: string | null;
}): GroupMember {
  return {
    userId: row.user_id,
    groupId: row.group_id,
    joinedAt: row.joined_at ?? undefined,
  };
}

function mapGroupAdminRow(row: {
  user_id: string;
  group_id: string;
  assigned_at?: string | null;
}): GroupAdmin {
  return {
    userId: row.user_id,
    groupId: row.group_id,
    assignedAt: row.assigned_at ?? undefined,
  };
}

function mapRow(row: {
  user_id: string;
  display_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  birth_date?: string | null;
  country?: string | null;
  preferred_language?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  updated_at?: string | null;
}): Profile {
  const derivedDisplayName = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
  const displayName = row.display_name?.trim() || derivedDisplayName || undefined;
  return {
    userId: row.user_id,
    displayName: displayName ?? undefined,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    birthDate: row.birth_date ?? undefined,
    country: row.country ?? undefined,
    preferredLanguage: row.preferred_language ?? undefined,
    avatarUrl: row.avatar_url ?? undefined,
    bio: row.bio ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

/**
 * Supabase data adapter. Implements profile operations (Story 1.5),
 * notification preferences (Story 1.6), and group operations (simplified MVP).
 */
export function createSupabaseDataAdapter(getClient: () => SupabaseClient): DataContract {
  return {
    async getProfile(userId: string): Promise<Profile | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('profiles')
          .select(
            'user_id, display_name, first_name, last_name, birth_date, country, preferred_language, avatar_url, bio, updated_at'
          )
          .eq('user_id', userId)
          .maybeSingle();
        if (error) return toApiError(error);
        if (!data) return { message: 'Profile not found', code: 'NOT_FOUND' };
        const profile = mapRow(data);
        if (profile.avatarUrl) {
          profile.avatarUrl = await resolveAvatarDisplayUrl(getClient, profile.avatarUrl);
        }
        return profile;
      } catch (e) {
        return toApiError(e);
      }
    },

    async createProfile(userId: string, data: OnboardingProfileData): Promise<Profile | ApiError> {
      try {
        const derivedDisplayName = [data.firstName, data.lastName].filter(Boolean).join(' ').trim();
        const payload = {
          user_id: userId,
          first_name: data.firstName,
          last_name: data.lastName,
          birth_date: data.birthDate ?? null,
          country: data.country ?? null,
          preferred_language: data.preferredLanguage ?? null,
          display_name: derivedDisplayName || null,
          updated_at: new Date().toISOString(),
        };

        const { data: row, error } = await getClient()
          .from('profiles')
          .upsert(payload, { onConflict: 'user_id' })
          .select(
            'user_id, display_name, first_name, last_name, birth_date, country, preferred_language, avatar_url, bio, updated_at'
          )
          .single();
        if (error) return toApiError(error);
        if (!row) return { message: 'Profile not found', code: 'NOT_FOUND' };
        return mapRow(row);
      } catch (e) {
        return toApiError(e);
      }
    },

    async updateProfile(userId: string, updates: ProfileUpdates): Promise<Profile | ApiError> {
      try {
        const existing = await this.getProfile(userId);
        const current = ('userId' in existing ? existing : null) as Profile | null;
        const merged: Profile = {
          userId,
          displayName: updates.displayName ?? current?.displayName,
          avatarUrl: updates.avatarUrl ?? current?.avatarUrl,
          bio: updates.bio ?? current?.bio,
          preferredLanguage: updates.preferredLanguage ?? current?.preferredLanguage,
        };

        const payload = {
          user_id: userId,
          display_name: merged.displayName ?? null,
          avatar_url: merged.avatarUrl ?? null,
          bio: merged.bio ?? null,
          preferred_language: merged.preferredLanguage ?? null,
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await getClient()
          .from('profiles')
          .upsert(payload, { onConflict: 'user_id' })
          .select(
            'user_id, display_name, first_name, last_name, birth_date, country, preferred_language, avatar_url, bio, updated_at'
          )
          .single();
        if (error) return toApiError(error);
        if (!data) return { message: 'Profile not found', code: 'NOT_FOUND' };
        const profile = mapRow(data);
        if (profile.avatarUrl) {
          profile.avatarUrl = await resolveAvatarDisplayUrl(getClient, profile.avatarUrl);
        }
        return profile;
      } catch (e) {
        return toApiError(e);
      }
    },

    async getNotificationPreferences(userId: string): Promise<NotificationPreferences | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('notification_preferences')
          .select('user_id, events_enabled, announcements_enabled, messages_enabled, updated_at')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) return toApiError(error);
        if (data) return mapNotificationPrefsRow(data);
        const defaults = {
          user_id: userId,
          events_enabled: true,
          announcements_enabled: true,
          messages_enabled: true,
          updated_at: new Date().toISOString(),
        };
        const { data: inserted, error: insertError } = await getClient()
          .from('notification_preferences')
          .upsert(defaults, { onConflict: 'user_id' })
          .select('user_id, events_enabled, announcements_enabled, messages_enabled, updated_at')
          .single();
        if (insertError) return toApiError(insertError);
        if (!inserted) return { message: 'Failed to create preferences', code: 'NOT_FOUND' };
        return mapNotificationPrefsRow(inserted);
      } catch (e) {
        return toApiError(e);
      }
    },

    async updateNotificationPreferences(
      userId: string,
      updates: NotificationPreferencesUpdates
    ): Promise<NotificationPreferences | ApiError> {
      try {
        const existing = await this.getNotificationPreferences(userId);
        const current = !isApiError(existing) ? existing : null;
        const merged: NotificationPreferences = {
          userId,
          eventsEnabled: updates.eventsEnabled ?? current?.eventsEnabled ?? true,
          announcementsEnabled:
            updates.announcementsEnabled ?? current?.announcementsEnabled ?? true,
          messagesEnabled: updates.messagesEnabled ?? current?.messagesEnabled ?? true,
          updatedAt: new Date().toISOString(),
        };
        const payload = {
          user_id: userId,
          events_enabled: merged.eventsEnabled,
          announcements_enabled: merged.announcementsEnabled,
          messages_enabled: merged.messagesEnabled,
          updated_at: merged.updatedAt,
        };
        const { data, error } = await getClient()
          .from('notification_preferences')
          .upsert(payload, { onConflict: 'user_id' })
          .select('user_id, events_enabled, announcements_enabled, messages_enabled, updated_at')
          .single();
        if (error) return toApiError(error);
        if (!data) return { message: 'Failed to update preferences', code: 'NOT_FOUND' };
        return mapNotificationPrefsRow(data);
      } catch (e) {
        return toApiError(e);
      }
    },

    async uploadProfileImage(
      userId: string,
      imageUri: string,
      base64Data?: string | null
    ): Promise<string | ApiError> {
      try {
        const { body, contentType } =
          base64Data != null && base64Data.length > 0
            ? base64ToArrayBuffer(base64Data, contentTypeFromUri(imageUri))
            : await readImageFile(imageUri);
        const ext =
          contentType === 'image/png'
            ? 'png'
            : contentType === 'image/gif'
              ? 'gif'
              : contentType === 'image/webp'
                ? 'webp'
                : 'jpg';
        const path = `${userId}/avatar.${ext}`;

        const { error } = await getClient().storage.from('avatars').upload(path, body, {
          upsert: true,
          contentType,
        });
        if (error) return toApiError(error);

        const { data } = getClient().storage.from('avatars').getPublicUrl(path);
        return data.publicUrl;
      } catch (e) {
        return toApiError(e);
      }
    },

    // Groups
    async getGroups(params?: {
      type?: 'forum' | 'ministry';
      search?: string;
    }): Promise<Group[] | ApiError> {
      try {
        let query = getClient()
          .from('groups')
          .select(
            'id, type, name, description, banner_image_url, preferred_language, country, created_by_user_id, created_at, updated_at, group_members(count)'
          )
          .order('name');
        if (params?.type) {
          query = query.eq('type', params.type);
        }
        if (params?.search?.trim()) {
          const term = params.search.trim();
          const pattern = `%${term}%`;
          query = query.or(`name.ilike.${pattern},description.ilike.${pattern}`);
        }
        const { data, error } = await query;
        if (error) return toApiError(error);
        return (data ?? []).map(mapGroupRow);
      } catch (e) {
        return toApiError(e);
      }
    },

    async getGroup(id: string): Promise<Group | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('groups')
          .select(
            'id, type, name, description, banner_image_url, preferred_language, country, created_by_user_id, created_at, updated_at, group_members(count)'
          )
          .eq('id', id)
          .single();
        if (error) return toApiError(error);
        if (!data) return { message: 'Group not found', code: 'NOT_FOUND' };
        return mapGroupRow(data);
      } catch (e) {
        return toApiError(e);
      }
    },

    async createGroup(
      params: CreateGroupInput,
      createdByUserId: string
    ): Promise<Group | ApiError> {
      try {
        const name = params.name?.trim();
        if (!name) {
          return { message: 'Group name is required', code: 'VALIDATION_ERROR' };
        }
        const payload = {
          type: params.type,
          name,
          description: params.description?.trim() || null,
          banner_image_url: params.bannerImageUrl || null,
          preferred_language: params.preferredLanguage ?? 'en',
          country: params.country ?? 'Online',
          created_by_user_id: createdByUserId,
          updated_at: new Date().toISOString(),
        };
        const { data, error } = await getClient()
          .from('groups')
          .insert(payload)
          .select(
            'id, type, name, description, banner_image_url, preferred_language, country, created_by_user_id, created_at, updated_at'
          )
          .single();
        if (error) return toApiError(error);
        if (!data) return { message: 'Failed to create group', code: 'NOT_FOUND' };
        return mapGroupRow(data);
      } catch (e) {
        return toApiError(e);
      }
    },

    async updateGroup(id: string, params: UpdateGroupInput): Promise<Group | ApiError> {
      try {
        const payload: Record<string, unknown> = {
          updated_at: new Date().toISOString(),
        };
        if (params.name !== undefined) payload.name = params.name;
        if (params.description !== undefined) payload.description = params.description;
        if (params.bannerImageUrl !== undefined) payload.banner_image_url = params.bannerImageUrl;
        if (params.preferredLanguage !== undefined)
          payload.preferred_language = params.preferredLanguage;
        if (params.country !== undefined) payload.country = params.country;

        const { data, error } = await getClient()
          .from('groups')
          .update(payload)
          .eq('id', id)
          .select(
            'id, type, name, description, banner_image_url, preferred_language, country, created_by_user_id, created_at, updated_at'
          )
          .single();
        if (error) return toApiError(error);
        if (!data) return { message: 'Group not found', code: 'NOT_FOUND' };
        return mapGroupRow(data);
      } catch (e) {
        return toApiError(e);
      }
    },

    async getGroupMembers(groupId: string): Promise<GroupMember[] | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('group_members')
          .select('user_id, group_id, joined_at')
          .eq('group_id', groupId)
          .order('joined_at');
        if (error) return toApiError(error);
        return (data ?? []).map(mapGroupMemberRow);
      } catch (e) {
        return toApiError(e);
      }
    },

    async joinGroup(groupId: string, userId: string): Promise<void | ApiError> {
      try {
        const { error } = await getClient()
          .from('group_members')
          .insert({ group_id: groupId, user_id: userId });
        if (error) return toApiError(error);
      } catch (e) {
        return toApiError(e);
      }
    },

    async leaveGroup(groupId: string, userId: string): Promise<void | ApiError> {
      try {
        const { error } = await getClient()
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', userId);
        if (error) return toApiError(error);
      } catch (e) {
        return toApiError(e);
      }
    },

    async getGroupsForUser(userId: string): Promise<Group[] | ApiError> {
      try {
        const { data: memberships, error: memError } = await getClient()
          .from('group_members')
          .select('group_id')
          .eq('user_id', userId);
        if (memError) return toApiError(memError);
        const groupIds = (memberships ?? []).map((m) => m.group_id);
        if (groupIds.length === 0) return [];
        const { data, error } = await getClient()
          .from('groups')
          .select(
            'id, type, name, description, banner_image_url, preferred_language, country, created_by_user_id, created_at, updated_at, group_members(count)'
          )
          .in('id', groupIds)
          .order('name');
        if (error) return toApiError(error);
        return (data ?? []).map(mapGroupRow);
      } catch (e) {
        return toApiError(e);
      }
    },

    async getGroupAdmins(groupId: string): Promise<GroupAdmin[] | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('group_admins')
          .select('user_id, group_id, assigned_at')
          .eq('group_id', groupId)
          .order('assigned_at');
        if (error) return toApiError(error);
        return (data ?? []).map(mapGroupAdminRow);
      } catch (e) {
        return toApiError(e);
      }
    },

    async isSuperAdmin(userId: string): Promise<boolean | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('app_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) return toApiError(error);
        return data?.role === 'super_admin';
      } catch (e) {
        return toApiError(e);
      }
    },

    async isAdmin(userId: string): Promise<boolean | ApiError> {
      try {
        const { data, error } = await getClient()
          .from('app_roles')
          .select('role')
          .eq('user_id', userId)
          .maybeSingle();
        if (error) return toApiError(error);
        return data?.role === 'super_admin' || data?.role === 'admin';
      } catch (e) {
        return toApiError(e);
      }
    },

    async getGroupsWhereUserIsAdmin(userId: string): Promise<Group[] | ApiError> {
      try {
        const { data: adminRows, error: adminError } = await getClient()
          .from('group_admins')
          .select('group_id')
          .eq('user_id', userId);
        if (adminError) return toApiError(adminError);
        const groupIds = (adminRows ?? []).map((r) => r.group_id);
        if (groupIds.length === 0) return [];
        const { data, error } = await getClient()
          .from('groups')
          .select(
            'id, type, name, description, banner_image_url, preferred_language, country, created_by_user_id, created_at, updated_at, group_members(count)'
          )
          .in('id', groupIds)
          .order('name');
        if (error) return toApiError(error);
        return (data ?? []).map(mapGroupRow);
      } catch (e) {
        return toApiError(e);
      }
    },

    async assignAdmin(userId: string, assignedByUserId: string): Promise<void | ApiError> {
      try {
        const { error } = await getClient().from('app_roles').insert({
          user_id: userId,
          role: 'admin',
          assigned_by_user_id: assignedByUserId,
        });
        if (error) return toApiError(error);
      } catch (e) {
        return toApiError(e);
      }
    },

    async revokeAdmin(userId: string): Promise<void | ApiError> {
      try {
        const { error } = await getClient()
          .from('app_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
        if (error) return toApiError(error);
      } catch (e) {
        return toApiError(e);
      }
    },

    async getUserIdByEmail(email: string): Promise<string | null | ApiError> {
      try {
        const { data, error } = await getClient().rpc('get_user_id_by_email', {
          lookup_email: email,
        });
        if (error) return toApiError(error);
        return (data as string | null) ?? null;
      } catch (e) {
        return toApiError(e);
      }
    },
  };
}
