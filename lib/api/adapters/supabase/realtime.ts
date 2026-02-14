import type { RealtimeContract, RealtimeChannelId, RealtimeHandlers } from '../../contracts';

/**
 * Supabase realtime adapter. Full implementation in later stories.
 * Stub: implements RealtimeContract; subscribe/unsubscribe in 1.4+.
 */
export function createSupabaseRealtimeAdapter(_getClient: () => unknown): RealtimeContract {
  return {
    async subscribe(_channelId: RealtimeChannelId, _handlers: RealtimeHandlers) {
      return {};
    },
    async unsubscribe(_channelId: RealtimeChannelId) {},
  };
}
