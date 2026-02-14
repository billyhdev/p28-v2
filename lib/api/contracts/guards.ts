import type { ApiError } from './errors';
import type { Profile } from './dto';

/**
 * Type guard: data API results (Profile | ApiError). Use for getProfile, updateProfile, createProfile.
 */
export function isApiError(r: Profile | ApiError): r is ApiError {
  return 'message' in r && !('userId' in r);
}
