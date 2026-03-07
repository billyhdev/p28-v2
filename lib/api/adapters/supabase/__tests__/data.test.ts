/**
 * Story 1.5: Unit tests for Supabase data adapter (profile operations).
 * Story 1.6: Unit tests for notification preferences.
 * Story 2.2: Unit tests for org/ministry/group operations.
 */
import type { ApiError } from '../../../contracts/errors';
import type {
  Group,
  GroupDiscussion,
  NotificationPreferences,
  Profile,
} from '../../../contracts/dto';
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

  describe('Groups (simplified MVP)', () => {
    describe('getGroups', () => {
      it('returns Group[] on success', async () => {
        const rows = [
          {
            id: 'grp-1',
            type: 'forum',
            name: 'Discussion Forum',
            description: null,
            banner_image_url: null,
            preferred_language: 'en',
            country: 'Online',
            created_by_user_id: 'user-1',
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
        ];
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              order: jest.fn().mockResolvedValue({ data: rows, error: null }),
            }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getGroups();
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          const list = result as Group[];
          expect(list).toHaveLength(1);
          expect(list[0].id).toBe('grp-1');
          expect(list[0].type).toBe('forum');
          expect(list[0].name).toBe('Discussion Forum');
        }
      });
    });

    describe('getGroup', () => {
      it('returns Group on success', async () => {
        const row = {
          id: 'grp-1',
          type: 'ministry',
          name: 'Youth Ministry',
          description: 'A ministry for youth',
          banner_image_url: null,
          preferred_language: 'en',
          country: 'US',
          created_by_user_id: 'user-1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        };
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: row, error: null }),
              }),
            }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getGroup('grp-1');
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect((result as Group).id).toBe('grp-1');
          expect((result as Group).type).toBe('ministry');
          expect((result as Group).name).toBe('Youth Ministry');
          expect((result as Group).description).toBe('A ministry for youth');
        }
      });

      it('returns NOT_FOUND when group missing', async () => {
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
              }),
            }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getGroup('missing');
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) expect((result as ApiError).code).toBe('NOT_FOUND');
      });
    });

    describe('createGroup', () => {
      it('returns Group on success and adds creator as member', async () => {
        const row = {
          id: 'grp-new',
          type: 'forum',
          name: 'New Forum',
          description: null,
          banner_image_url: null,
          preferred_language: 'en',
          country: 'Online',
          created_by_user_id: 'user-1',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        };
        const groupMembersInsert = jest.fn().mockResolvedValue({ error: null });
        const fromMock = jest.fn((table: string) => {
          if (table === 'groups') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({ data: row, error: null }),
                }),
              }),
            };
          }
          if (table === 'group_members') {
            return { insert: groupMembersInsert };
          }
          return { insert: jest.fn() };
        });
        const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createGroup({ type: 'forum', name: 'New Forum' }, 'user-1');
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect((result as Group).id).toBe('grp-new');
          expect((result as Group).name).toBe('New Forum');
        }
        expect(groupMembersInsert).toHaveBeenCalledWith({
          group_id: 'grp-new',
          user_id: 'user-1',
        });
      });

      it('returns ApiError when name is empty', async () => {
        const getClient = (() => ({ from: jest.fn() })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createGroup({ type: 'forum', name: '' }, 'user-1');
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('Group name is required');
          expect((result as ApiError).code).toBe('VALIDATION_ERROR');
        }
      });
    });

    describe('deleteGroup', () => {
      it('returns undefined on success', async () => {
        const eqMock = jest.fn().mockResolvedValue({ error: null });
        const deleteMock = jest.fn().mockReturnValue({ eq: eqMock });
        const fromMock = jest.fn((table: string) =>
          table === 'groups' ? { delete: deleteMock } : {}
        );
        const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.deleteGroup('grp-1');
        expect(result).toBeUndefined();
        expect(fromMock).toHaveBeenCalledWith('groups');
        expect(eqMock).toHaveBeenCalledWith('id', 'grp-1');
      });
    });

    describe('joinGroup', () => {
      it('returns undefined on success', async () => {
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            insert: jest.fn().mockResolvedValue({ error: null }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.joinGroup('grp-1', 'user-1');
        expect(result).toBeUndefined();
      });
    });

    describe('leaveGroup', () => {
      it('returns undefined on success', async () => {
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            delete: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                eq: jest.fn().mockResolvedValue({ error: null }),
              }),
            }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.leaveGroup('grp-1', 'user-1');
        expect(result).toBeUndefined();
      });
    });

    describe('getGroupDiscussions', () => {
      it('returns GroupDiscussion[] on success with author profiles', async () => {
        const discussionRows = [
          {
            id: 'disc-1',
            group_id: 'grp-1',
            user_id: 'user-1',
            body: 'Hello everyone',
            created_at: '2024-01-02T10:00:00Z',
          },
        ];
        const profileRow = {
          display_name: 'Alice',
          first_name: 'Alice',
          last_name: 'Smith',
          avatar_url: null,
        };
        let callCount = 0;
        const fromMock = jest.fn().mockImplementation((table: string) => {
          if (table === 'group_discussions') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({
                    data: discussionRows,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            callCount++;
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: profileRow,
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        });
        const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getGroupDiscussions('grp-1');
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          const list = result as GroupDiscussion[];
          expect(list).toHaveLength(1);
          expect(list[0].id).toBe('disc-1');
          expect(list[0].groupId).toBe('grp-1');
          expect(list[0].userId).toBe('user-1');
          expect(list[0].body).toBe('Hello everyone');
          expect(list[0].createdAt).toBe('2024-01-02T10:00:00Z');
          expect(list[0].authorDisplayName).toBe('Alice');
        }
      });

      it('returns empty array when no discussions', async () => {
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getGroupDiscussions('grp-1');
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect(result as GroupDiscussion[]).toHaveLength(0);
        }
      });

      it('returns ApiError when query fails', async () => {
        const getClient = (() => ({
          from: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                order: jest.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
              }),
            }),
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getGroupDiscussions('grp-1');
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('DB error');
        }
      });
    });

    describe('createGroupDiscussion', () => {
      it('returns GroupDiscussion on success', async () => {
        const insertedRow = {
          id: 'disc-new',
          group_id: 'grp-1',
          user_id: 'user-1',
          body: 'My first post',
          created_at: '2024-01-03T12:00:00Z',
        };
        const profileRow = {
          display_name: 'Bob',
          first_name: 'Bob',
          last_name: 'Jones',
          avatar_url: null,
        };
        let callCount = 0;
        const fromMock = jest.fn().mockImplementation((table: string) => {
          if (table === 'group_discussions') {
            return {
              insert: jest.fn().mockReturnValue({
                select: jest.fn().mockReturnValue({
                  single: jest.fn().mockResolvedValue({
                    data: insertedRow,
                    error: null,
                  }),
                }),
              }),
            };
          }
          if (table === 'profiles') {
            return {
              select: jest.fn().mockReturnValue({
                eq: jest.fn().mockReturnValue({
                  maybeSingle: jest.fn().mockResolvedValue({
                    data: profileRow,
                    error: null,
                  }),
                }),
              }),
            };
          }
          return {};
        });
        const getClient = (() => ({ from: fromMock })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createGroupDiscussion('grp-1', 'user-1', {
          body: 'My first post',
        });
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          const d = result as GroupDiscussion;
          expect(d.id).toBe('disc-new');
          expect(d.groupId).toBe('grp-1');
          expect(d.userId).toBe('user-1');
          expect(d.body).toBe('My first post');
          expect(d.authorDisplayName).toBe('Bob');
        }
      });

      it('returns ApiError when body is empty', async () => {
        const getClient = (() => ({ from: jest.fn() })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createGroupDiscussion('grp-1', 'user-1', { body: '' });
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('Message body is required');
          expect((result as ApiError).code).toBe('VALIDATION_ERROR');
        }
      });

      it('returns ApiError when body is only whitespace', async () => {
        const getClient = (() => ({ from: jest.fn() })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createGroupDiscussion('grp-1', 'user-1', {
          body: '   \n\t  ',
        });
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('Message body is required');
        }
      });
    });

    describe('getDiscussions', () => {
      it('returns Discussion[] ordered by created_at desc', async () => {
        const rows = [
          {
            id: 'd1',
            group_id: 'grp-1',
            user_id: 'u1',
            title: 'Topic A',
            body: 'Body A',
            created_at: '2024-01-02T10:00:00Z',
            groups: { name: 'Forum 1' },
          },
        ];
        const getClient = (() => ({
          from: jest.fn().mockImplementation((table: string) => {
            if (table === 'discussions') {
              return {
                select: jest.fn().mockReturnValue({
                  order: jest.fn().mockResolvedValue({ data: rows, error: null }),
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: rows, error: null }),
                  }),
                }),
              };
            }
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              };
            }
            return {};
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getDiscussions();
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('d1');
          expect(result[0].title).toBe('Topic A');
          expect(result[0].groupName).toBe('Forum 1');
        }
      });
    });

    describe('createDiscussion', () => {
      it('returns Discussion on success', async () => {
        const insertedRow = {
          id: 'd-new',
          group_id: 'grp-1',
          user_id: 'u1',
          title: 'My Topic',
          body: 'My body',
          created_at: '2024-01-03T12:00:00Z',
        };
        const getClient = (() => ({
          from: jest.fn().mockImplementation((table: string) => {
            if (table === 'discussions') {
              return {
                insert: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: insertedRow,
                      error: null,
                    }),
                  }),
                }),
              };
            }
            if (table === 'groups') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({ data: { name: 'Forum 1' }, error: null }),
                  }),
                }),
              };
            }
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              };
            }
            return {};
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createDiscussion('grp-1', 'u1', {
          title: 'My Topic',
          body: 'My body',
        });
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect(result.id).toBe('d-new');
          expect(result.title).toBe('My Topic');
          expect(result.groupName).toBe('Forum 1');
        }
      });

      it('returns ApiError when title is empty', async () => {
        const adapter = createSupabaseDataAdapter((() => ({})) as unknown as GetClient);
        const result = await adapter.createDiscussion('grp-1', 'u1', { title: '', body: 'x' });
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('Discussion topic is required');
        }
      });
    });

    describe('getDiscussionPosts', () => {
      it('returns DiscussionPost[] ordered by created_at asc', async () => {
        const rows = [
          {
            id: 'p1',
            discussion_id: 'd1',
            user_id: 'u1',
            body: 'Reply 1',
            created_at: '2024-01-02T11:00:00Z',
          },
        ];
        const getClient = (() => ({
          from: jest.fn().mockImplementation((table: string) => {
            if (table === 'discussion_posts') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    order: jest.fn().mockResolvedValue({ data: rows, error: null }),
                  }),
                }),
              };
            }
            if (table === 'discussion_post_reactions') {
              return {
                select: jest.fn().mockReturnValue({
                  in: jest.fn().mockResolvedValue({ data: [], error: null }),
                }),
              };
            }
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              };
            }
            return {};
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getDiscussionPosts('d1');
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect(result).toHaveLength(1);
          expect(result[0].id).toBe('p1');
          expect(result[0].body).toBe('Reply 1');
        }
      });
    });

    describe('createDiscussionPost', () => {
      it('returns DiscussionPost on success', async () => {
        const insertedRow = {
          id: 'p-new',
          discussion_id: 'd1',
          user_id: 'u1',
          body: 'My reply',
          created_at: '2024-01-03T13:00:00Z',
        };
        const getClient = (() => ({
          from: jest.fn().mockImplementation((table: string) => {
            if (table === 'discussion_posts') {
              return {
                insert: jest.fn().mockReturnValue({
                  select: jest.fn().mockReturnValue({
                    single: jest.fn().mockResolvedValue({
                      data: insertedRow,
                      error: null,
                    }),
                  }),
                }),
              };
            }
            if (table === 'profiles') {
              return {
                select: jest.fn().mockReturnValue({
                  eq: jest.fn().mockReturnValue({
                    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
                  }),
                }),
              };
            }
            return {};
          }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.createDiscussionPost('d1', 'u1', { body: 'My reply' });
        expect(isApiError(result)).toBe(false);
        if (!isApiError(result)) {
          expect(result.id).toBe('p-new');
          expect(result.body).toBe('My reply');
        }
      });

      it('returns ApiError when body is empty and no images', async () => {
        const adapter = createSupabaseDataAdapter((() => ({})) as unknown as GetClient);
        const result = await adapter.createDiscussionPost('d1', 'u1', { body: '' });
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('Reply must have text or at least one image');
        }
      });
    });

    describe('getUserIdByEmail', () => {
      it('returns userId string on success', async () => {
        const getClient = (() => ({
          rpc: jest.fn().mockResolvedValue({ data: 'uuid-123', error: null }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getUserIdByEmail('alice@example.com');
        expect(isApiError(result)).toBe(false);
        expect(result).toBe('uuid-123');
      });

      it('returns null when user not found', async () => {
        const getClient = (() => ({
          rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getUserIdByEmail('nobody@example.com');
        expect(isApiError(result)).toBe(false);
        expect(result).toBeNull();
      });

      it('returns ApiError on RPC error', async () => {
        const getClient = (() => ({
          rpc: jest.fn().mockResolvedValue({ data: null, error: { message: 'RPC failed' } }),
        })) as unknown as GetClient;
        const adapter = createSupabaseDataAdapter(getClient);
        const result = await adapter.getUserIdByEmail('bad@example.com');
        expect(isApiError(result)).toBe(true);
        if (isApiError(result)) {
          expect((result as ApiError).message).toBe('RPC failed');
        }
      });
    });
  });
});
