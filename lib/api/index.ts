/**
 * Backend facade. App and components import only from here (e.g. api.auth.getSession()).
 * Do not import from lib/api/adapters/ or @supabase/* outside the adapter layer.
 */
import * as supabaseAdapter from './adapters/supabase';

export const auth = supabaseAdapter.auth;
export const data = supabaseAdapter.data;
export const realtime = supabaseAdapter.realtime;

/** Facade object for app usage: api.auth, api.data, api.realtime */
export const api = { auth, data, realtime };

export { getUserFacingError } from '../errors';

export { isApiError } from './contracts';
export type {
  AuthContract,
  AuthStateListener,
  DataContract,
  RealtimeContract,
  RealtimeChannelId,
  RealtimeHandlers,
  ApiError,
  User,
  Session,
  Profile,
  ProfileUpdates,
  OnboardingProfileData,
  NotificationPreferences,
  NotificationPreferencesUpdates,
} from './contracts';
