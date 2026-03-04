/**
 * Story 1.5: Unit tests for Supabase data adapter (profile operations).
 * Story 1.6: Unit tests for notification preferences.
 */
import type { ApiError } from '../../../contracts/errors';
import type { NotificationPreferences, Profile } from '../../../contracts/dto';
import { isApiError } from '../../../contracts/guards';
import { createSupabaseDataAdapter } from '../data';

type GetClient = Parameters<typeof createSupabaseDataAdapter>[0];

describe('Supabase data adapter', () => {
  describe('getProfile', () => {
    it('returns Profile when found', async () => {
      const row = {
        user_id: 'user-1',
        display_name: 'Test User',
        first_name: 'Test',
        last_name: 'User',
        birth_date: '1990-01-01',
        country: 'US',
        preferred_language: 'en',
        avatar_url: 'https://example.com/avatar.jpg',
        bio: 'Hello',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const getClient = (() => ({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
            }),
          }),
        }),
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getProfile('user-1');
      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        const profile = result as Profile;
        expect(profile.userId).toBe('user-1');
        expect(profile.displayName).toBe('Test User');
        expect(profile.firstName).toBe('Test');
        expect(profile.lastName).toBe('User');
        expect(profile.birthDate).toBe('1990-01-01');
        expect(profile.country).toBe('US');
        expect(profile.preferredLanguage).toBe('en');
      }
    });

    it('returns ApiError when not found', async () => {
      const getClient = (() => ({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }),
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getProfile('user-1');
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect((result as ApiError).code).toBe('NOT_FOUND');
      }
    });

    it('returns ApiError when Supabase errors', async () => {
      const getClient = (() => ({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            }),
          }),
        }),
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getProfile('user-1');
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect((result as ApiError).message).toBe('DB error');
      }
    });
  });

  describe('updateProfile', () => {
    it('returns Profile on success', async () => {
      const existingRow = {
        user_id: 'user-1',
        display_name: 'Old',
        first_name: 'Old',
        last_name: 'Name',
        birth_date: null,
        country: null,
        preferred_language: 'en',
        avatar_url: null,
        bio: null,
        updated_at: null,
      };
      const updatedRow = {
        user_id: 'user-1',
        display_name: 'Old',
        first_name: 'Old',
        last_name: 'Name',
        birth_date: null,
        country: null,
        preferred_language: 'es',
        avatar_url: null,
        bio: null,
        updated_at: '2024-01-02T00:00:00Z',
      };
      let callCount = 0;
      const fromMock = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: () => Promise.resolve({ data: existingRow, error: null }),
              }),
            }),
          };
        }
        return {
          upsert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: updatedRow, error: null }),
            }),
          }),
        };
      });
      const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.updateProfile('user-1', {
        preferredLanguage: 'es',
      });
      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect((result as Profile).displayName).toBe('Old');
        expect((result as Profile).preferredLanguage).toBe('es');
      }
    });
  });

  describe('createProfile', () => {
    it('upserts onboarding fields and returns Profile', async () => {
      const row = {
        user_id: 'user-1',
        display_name: 'Jane Doe',
        first_name: 'Jane',
        last_name: 'Doe',
        birth_date: '2000-12-31',
        country: 'US',
        preferred_language: 'en',
        avatar_url: null,
        bio: null,
        updated_at: '2024-01-03T00:00:00Z',
      };
      const getClient = (() => ({
        from: jest.fn().mockReturnValue({
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: row, error: null }),
            }),
          }),
        }),
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.createProfile('user-1', {
        firstName: 'Jane',
        lastName: 'Doe',
        birthDate: '2000-12-31',
        country: 'US',
        preferredLanguage: 'en',
      });
      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        expect((result as Profile).displayName).toBe('Jane Doe');
        expect((result as Profile).firstName).toBe('Jane');
        expect((result as Profile).lastName).toBe('Doe');
        expect((result as Profile).preferredLanguage).toBe('en');
      }
    });
  });

  describe('uploadProfileImage', () => {
    it('returns public URL on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })),
      }) as jest.Mock;
      const bucketMock = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/avatars/user-1/avatar.jpg' },
        }),
      };
      const getClient = (() => ({
        storage: { from: jest.fn().mockReturnValue(bucketMock) },
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.uploadProfileImage('user-1', 'file:///tmp/photo.jpg');
      expect(typeof result).toBe('string');
      expect(result).toBe('https://example.com/avatars/user-1/avatar.jpg');
    });

    it('returns ApiError when fetch fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
      const getClient = (() => ({ storage: { from: jest.fn() } })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.uploadProfileImage('user-1', 'file:///tmp/photo.jpg');
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('message');
    });

    it('uploads from base64 when provided (e.g. from image picker)', async () => {
      const bucketMock = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/avatars/user-1/avatar.jpg' },
        }),
      };
      const getClient = (() => ({
        storage: { from: jest.fn().mockReturnValue(bucketMock) },
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const base64 = Buffer.from('fake-image-bytes').toString('base64');
      const result = await adapter.uploadProfileImage('user-1', 'file:///ignored.jpg', base64);
      expect(typeof result).toBe('string');
      expect(result).toBe('https://example.com/avatars/user-1/avatar.jpg');
      expect(bucketMock.upload).toHaveBeenCalledWith(
        'user-1/avatar.jpg',
        expect.any(ArrayBuffer),
        expect.objectContaining({ contentType: 'image/jpeg', upsert: true })
      );
      const uploadedBody = (bucketMock.upload as jest.Mock).mock.calls[0][1];
      expect(uploadedBody.byteLength).toBeGreaterThan(0);
    });
  });

  describe('getNotificationPreferences', () => {
    it('returns NotificationPreferences when found', async () => {
      const row = {
        user_id: 'user-1',
        events_enabled: true,
        announcements_enabled: false,
        messages_enabled: true,
        updated_at: '2024-01-01T00:00:00Z',
      };
      const getClient = (() => ({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
            }),
          }),
        }),
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getNotificationPreferences('user-1');
      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        const prefs = result as NotificationPreferences;
        expect(prefs.userId).toBe('user-1');
        expect(prefs.eventsEnabled).toBe(true);
        expect(prefs.announcementsEnabled).toBe(false);
        expect(prefs.messagesEnabled).toBe(true);
      }
    });

    it('creates row with defaults when not found', async () => {
      const insertedRow = {
        user_id: 'user-new',
        events_enabled: true,
        announcements_enabled: true,
        messages_enabled: true,
        updated_at: '2024-01-02T00:00:00Z',
      };
      let fromCallCount = 0;
      const fromMock = jest.fn().mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: insertedRow, error: null }),
            }),
          }),
        };
      });
      const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getNotificationPreferences('user-new');
      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        const prefs = result as NotificationPreferences;
        expect(prefs.userId).toBe('user-new');
        expect(prefs.eventsEnabled).toBe(true);
        expect(prefs.announcementsEnabled).toBe(true);
        expect(prefs.messagesEnabled).toBe(true);
      }
    });

    it('returns ApiError when Supabase errors on select', async () => {
      const getClient = (() => ({
        from: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              maybeSingle: jest
                .fn()
                .mockResolvedValue({ data: null, error: { message: 'DB error' } }),
            }),
          }),
        }),
      })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getNotificationPreferences('user-1');
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect((result as ApiError).message).toBe('DB error');
      }
    });

    it('returns ApiError when upsert fails after row not found', async () => {
      let fromCallCount = 0;
      const fromMock = jest.fn().mockImplementation(() => {
        fromCallCount++;
        if (fromCallCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          };
        }
        return {
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Insert failed' },
              }),
            }),
          }),
        };
      });
      const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getNotificationPreferences('user-new');
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect((result as ApiError).message).toBe('Insert failed');
      }
    });
  });

  describe('updateNotificationPreferences', () => {
    it('returns NotificationPreferences on success', async () => {
      const existingRow = {
        user_id: 'user-1',
        events_enabled: true,
        announcements_enabled: true,
        messages_enabled: true,
        updated_at: '2024-01-01T00:00:00Z',
      };
      const updatedRow = {
        user_id: 'user-1',
        events_enabled: true,
        announcements_enabled: false,
        messages_enabled: true,
        updated_at: '2024-01-02T00:00:00Z',
      };
      let callCount = 0;
      const fromMock = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({
                  data: existingRow,
                  error: null,
                }),
              }),
            }),
          };
        }
        return {
          upsert: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: updatedRow, error: null }),
            }),
          }),
        };
      });
      const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.updateNotificationPreferences('user-1', {
        announcementsEnabled: false,
      });
      expect(isApiError(result)).toBe(false);
      if (!isApiError(result)) {
        const prefs = result as NotificationPreferences;
        expect(prefs.announcementsEnabled).toBe(false);
        expect(prefs.eventsEnabled).toBe(true);
        expect(prefs.messagesEnabled).toBe(true);
      }
    });

    it('returns ApiError when update fails', async () => {
      const existingRow = {
        user_id: 'user-1',
        events_enabled: true,
        announcements_enabled: true,
        messages_enabled: true,
        updated_at: null,
      };
      const fromMock = jest.fn().mockImplementation(() => ({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            maybeSingle: jest.fn().mockResolvedValue({
              data: existingRow,
              error: null,
            }),
          }),
        }),
        upsert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Update failed' },
            }),
          }),
        }),
      }));
      const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.updateNotificationPreferences('user-1', {
        eventsEnabled: false,
      });
      expect(isApiError(result)).toBe(true);
      if (isApiError(result)) {
        expect((result as ApiError).message).toBe('Update failed');
      }
    });
  });
});
