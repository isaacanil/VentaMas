export interface SessionInfoMetadata {
  timezone?: string | null;
  language?: string | null;
  requestSource?: string;
  requestedAt?: number;
  refreshSource?: string;
  lastActivityMs?: number;
  [key: string]: unknown;
}

export interface SessionInfo {
  deviceId?: string | null;
  deviceLabel?: string | null;
  userAgent?: string | null;
  platform?: string | null;
  metadata?: SessionInfoMetadata;
  [key: string]: unknown;
}

export interface StoredSession {
  sessionToken: string | null;
  sessionExpiresAt: number | string | null;
  sessionId: string | null;
  deviceId: string | null;
}

export interface SessionRecord {
  id: string;
  userId: string;
  expiresAt?: number;
  [key: string]: unknown;
}

export interface SessionLogEntry {
  id?: string;
  [key: string]: unknown;
}

export interface SessionResponsePayload {
  ok?: boolean;
  message?: string;
  session?: SessionRecord;
  sessionToken?: string;
  sessionExpiresAt?: number;
  activeSessions?: unknown[];
  user?: unknown;
  logs?: SessionLogEntry[];
  [key: string]: unknown;
}
