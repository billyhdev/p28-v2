import type { SupabaseClient } from '@supabase/supabase-js';
import type { DataContract } from '../../contracts';
import type { ApiError } from '../../contracts/errors';
import type { OnboardingProfileData, Profile, ProfileUpdates } from '../../contracts/dto';

function toApiError(err: unknown): ApiError {
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as Error).message === 'string'
  ) {
    const e = err as Error & { code?: string };
    return { message: e.message, code: e.code };
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
 * Supabase data adapter. Implements profile operations (Story 1.5).
 * Domain operations for org/ministry/group in later stories.
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
          // Keep legacy column populated for compatibility.
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
  };
}
