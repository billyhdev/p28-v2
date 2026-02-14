/**
 * Story 1.5: Unit tests for Supabase data adapter (profile operations).
 */
import { createSupabaseDataAdapter } from '../data';

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
      const getClient = () =>
        ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: row, error: null }),
              }),
            }),
          }),
        }) as any;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getProfile('user-1');
      expect('userId' in result).toBe(true);
      expect((result as any).userId).toBe('user-1');
      expect((result as any).displayName).toBe('Test User');
      expect((result as any).firstName).toBe('Test');
      expect((result as any).lastName).toBe('User');
      expect((result as any).birthDate).toBe('1990-01-01');
      expect((result as any).country).toBe('US');
      expect((result as any).preferredLanguage).toBe('en');
    });

    it('returns ApiError when not found', async () => {
      const getClient = () =>
        ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
              }),
            }),
          }),
        }) as any;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getProfile('user-1');
      expect('message' in result).toBe(true);
      expect((result as any).code).toBe('NOT_FOUND');
    });

    it('returns ApiError when Supabase errors', async () => {
      const getClient = () =>
        ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                maybeSingle: jest
                  .fn()
                  .mockResolvedValue({ data: null, error: { message: 'DB error' } }),
              }),
            }),
          }),
        }) as any;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.getProfile('user-1');
      expect('message' in result).toBe(true);
      expect((result as any).message).toBe('DB error');
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
      const getClient = () => ({ from: fromMock }) as any;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.updateProfile('user-1', {
        preferredLanguage: 'es',
      });
      expect('userId' in result).toBe(true);
      expect((result as any).displayName).toBe('Old');
      expect((result as any).preferredLanguage).toBe('es');
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
      const getClient = () =>
        ({
          from: jest.fn().mockReturnValue({
            upsert: jest.fn().mockReturnValue({
              select: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: row, error: null }),
              }),
            }),
          }),
        }) as any;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.createProfile('user-1', {
        firstName: 'Jane',
        lastName: 'Doe',
        birthDate: '2000-12-31',
        country: 'US',
        preferredLanguage: 'en',
      });
      expect('userId' in result).toBe(true);
      expect((result as any).displayName).toBe('Jane Doe');
      expect((result as any).firstName).toBe('Jane');
      expect((result as any).lastName).toBe('Doe');
      expect((result as any).preferredLanguage).toBe('en');
    });
  });

  describe('uploadProfileImage', () => {
    it('returns public URL on success', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob(['x'], { type: 'image/jpeg' })),
      }) as any;
      const bucketMock = {
        upload: jest.fn().mockResolvedValue({ error: null }),
        getPublicUrl: jest.fn().mockReturnValue({
          data: { publicUrl: 'https://example.com/avatars/user-1/avatar.jpg' },
        }),
      };
      const getClient = () =>
        ({
          storage: { from: jest.fn().mockReturnValue(bucketMock) },
        }) as any;
      const adapter = createSupabaseDataAdapter(getClient);
      const result = await adapter.uploadProfileImage('user-1', 'file:///tmp/photo.jpg');
      expect(typeof result).toBe('string');
      expect(result).toBe('https://example.com/avatars/user-1/avatar.jpg');
    });

    it('returns ApiError when fetch fails', async () => {
      global.fetch = jest.fn().mockResolvedValue({ ok: false });
      const getClient = () => ({ storage: { from: jest.fn() } }) as any;
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
      const getClient = () =>
        ({
          storage: { from: jest.fn().mockReturnValue(bucketMock) },
        }) as any;
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
});
