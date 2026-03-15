/**
 * Types and utilities for Gmail-based integrations
 * 
 * This module provides a reusable abstraction for any feature that relies on Gmail API access,
 * including email-based sync (e.g., Tenpo purchases) and label-based workflows (e.g., Utilities).
 */

/**
 * Normalized status for Gmail integration state
 */
export type GmailSyncStatus = 
  | 'ok'           // Token valid, can sync
  | 'expired'      // Token expired, needs re-authorization
  | 'error'        // Error occurred (network, API, etc.)
  | 'unavailable'; // No token exists (first time setup)

/**
 * Complete Gmail integration state
 */
export interface GmailIntegrationState {
  status: GmailSyncStatus;
  canSync: boolean;
  lastSync?: Date | null;
  errorMessage?: string;
}

/**
 * Input data from backend /api/integrations/google/status
 */
export interface GmailAuthStatusResponse {
  authenticated: boolean;
  tokenExpired: boolean;
  expiryDate: Date | null;
}

/**
 * Normalizes backend auth status into a standardized GmailIntegrationState
 * 
 * @param authStatus - Response from /api/integrations/google/status
 * @param lastSync - Optional last sync timestamp (from local state or backend)
 * @returns Normalized integration state
 */
export function mapGmailAuthStatus(
  authStatus: GmailAuthStatusResponse | null,
  lastSync?: Date | null
): GmailIntegrationState {
  if (!authStatus) {
    return {
      status: 'unavailable',
      canSync: false,
      lastSync: null,
    };
  }

  const { authenticated, tokenExpired } = authStatus;

  if (!authenticated) {
    return {
      status: 'unavailable',
      canSync: false,
      lastSync,
    };
  }

  if (tokenExpired) {
    return {
      status: 'expired',
      canSync: false,
      lastSync,
    };
  }

  return {
    status: 'ok',
    canSync: true,
    lastSync,
  };
}

/**
 * Legacy mapper for components using old boolean props (tokenExpired, isAuthenticated)
 * Allows gradual migration from old state model to new GmailIntegrationState
 * 
 * @deprecated Use mapGmailAuthStatus with proper backend response instead
 */
export function mapLegacyAuthState(
  tokenExpired: boolean,
  hasAuthUrl: boolean,
  lastSync?: Date | null
): GmailIntegrationState {
  if (tokenExpired) {
    return {
      status: 'expired',
      canSync: false,
      lastSync,
    };
  }

  if (!hasAuthUrl) {
    return {
      status: 'ok',
      canSync: true,
      lastSync,
    };
  }

  return {
    status: 'unavailable',
    canSync: false,
    lastSync,
  };
}
