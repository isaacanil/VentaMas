import { DateTime } from 'luxon';

export const END_EVENTS = new Set([
  'logout',
  'revoked',
  'auto-revoked',
  'expired',
  'idle-timeout',
  'terminated',
  'idle',
]);

export type TimestampLike =
  | number
  | { seconds: number; nanoseconds: number }
  | { _seconds: number; _nanoseconds: number }
  | { toMillis: () => number }
  | null
  | undefined;

type TimestampSeconds = { seconds: number; nanoseconds: number };
type TimestampUnderscore = { _seconds: number; _nanoseconds: number };
type TimestampWithToMillis = { toMillis: () => number };

export interface SessionLogContextMetadata {
  deviceLabel?: string;
  label?: string;
  platform?: string;
  timezone?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface SessionLogActor {
  displayName?: string;
  name?: string;
  username?: string;
  [key: string]: unknown;
}

export interface SessionLogContext {
  metadata?: SessionLogContextMetadata;
  actor?: SessionLogActor;
  deviceLabel?: string;
  platform?: string;
  label?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: unknown;
}

export interface SessionLog {
  id?: string;
  sessionId?: string;
  event?: string;
  createdAt?: TimestampLike;
  context?: SessionLogContext;
  [key: string]: unknown;
}

export interface NormalizedSessionContext extends SessionLogContext {
  metadata: SessionLogContextMetadata;
  actor: SessionLogActor;
}

export interface NormalizedSessionLog extends SessionLog {
  createdAt: number | null;
  context: NormalizedSessionContext;
}

export interface SessionSummary {
  sessionId: string;
  startAt: number | null;
  endAt: number | null;
  durationMs: number | null;
  durationDisplay: string;
  startDisplay: string;
  endDisplay: string;
  deviceLabel: string;
  ipAddress: string;
  status: 'open' | 'closed';
  statusLabel: string;
  endEvent: string | null;
  index: number;
}

export interface PresenceState {
  state: string;
  status?: string;
  lastUpdated?: number | null;
  updatedAt?: number | null;
  lastSeen?: number | null;
}

export const normalizeContext = (
  context: SessionLogContext | null | undefined,
): NormalizedSessionContext => {
  if (!context || typeof context !== 'object') {
    return { metadata: {}, actor: {} };
  }

  const metadata =
    context.metadata && typeof context.metadata === 'object'
      ? context.metadata
      : {};
  const actor =
    context.actor && typeof context.actor === 'object' ? context.actor : {};

  return {
    ...context,
    metadata,
    actor,
  };
};

export const toMillis = (value: TimestampLike): number | null => {
  if (typeof value === 'number') return value;
  if (!value || typeof value !== 'object') return null;
  if (typeof (value as TimestampWithToMillis).toMillis === 'function') {
    return (value as TimestampWithToMillis).toMillis();
  }

  const secondsTimestamp = value as TimestampSeconds;
  if (
    typeof secondsTimestamp.seconds === 'number' &&
    typeof secondsTimestamp.nanoseconds === 'number'
  ) {
    return secondsTimestamp.seconds * 1000 + secondsTimestamp.nanoseconds / 1_000_000;
  }

  const underscoreTimestamp = value as TimestampUnderscore;
  if (
    typeof underscoreTimestamp._seconds === 'number' &&
    typeof underscoreTimestamp._nanoseconds === 'number'
  ) {
    return (
      underscoreTimestamp._seconds * 1000 +
      underscoreTimestamp._nanoseconds / 1_000_000
    );
  }

  return null;
};

export const formatDateTime = (value: TimestampLike): string => {
  const millis = toMillis(value);
  if (typeof millis !== 'number') return 'Sin registro';

  return DateTime.fromMillis(millis).toLocaleString(
    DateTime.DATETIME_MED_WITH_SECONDS,
  );
};

export const formatDuration = (millis: number | null): string => {
  if (!millis || millis <= 0) return 'En curso';

  const totalSeconds = Math.floor(millis / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
};

const LANGUAGE_CODE_REGEX = /^[a-z]{2}(?:-[A-Z]{2,3}|-[0-9]{3})?$/i;

const detectBrowser = (userAgent = '', parts: string[] = []) => {
  const haystack = `${userAgent} ${parts.join(' ')}`.toLowerCase();
  if (haystack.includes('edg')) return 'Edge';
  if (haystack.includes('opr') || haystack.includes('opera')) return 'Opera';
  if (haystack.includes('firefox')) return 'Firefox';
  if (haystack.includes('safari') && !haystack.includes('chrome')) {
    return 'Safari';
  }
  if (haystack.includes('chrome') || haystack.includes('chromium')) {
    return 'Chrome';
  }
  return null;
};

const detectOsLabel = (input = '') => {
  const lower = input.toLowerCase();
  if (lower.includes('android')) return 'Android';
  if (
    lower.includes('iphone') ||
    lower.includes('ipad') ||
    lower.includes('ios')
  )
    return 'iPhone';
  if (lower.includes('mac')) return 'Mac';
  if (lower.includes('windows')) return 'PC Windows';
  if (lower.includes('linux')) return 'PC Linux';
  return null;
};

interface DeviceLabelInput {
  deviceLabel?: string;
  platform?: string;
  userAgent?: string;
}

const formatDeviceLabel = ({
  deviceLabel,
  platform,
  userAgent,
}: DeviceLabelInput): string => {
  const normalizedLabel = typeof deviceLabel === 'string' ? deviceLabel : '';
  const pieces = normalizedLabel
    .split('•')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => !LANGUAGE_CODE_REGEX.test(part));

  const combined = [normalizedLabel, platform, userAgent]
    .filter(Boolean)
    .join(' ');

  const osLabel = detectOsLabel(combined) || 'Dispositivo';
  const browser = detectBrowser(userAgent, pieces);

  const isMobile = osLabel === 'Android' || osLabel === 'iPhone';
  if (isMobile) return osLabel;
  return browser ? `${osLabel} (${browser})` : osLabel;
};

const getSessionKey = (
  log: NormalizedSessionLog,
  index: number,
  fallbackCount: number,
) => {
  if (log.sessionId) return log.sessionId;
  if (log.id) return log.id;
  return `session-${log.createdAt || Date.now()}-${fallbackCount + index}`;
};

export const buildSessionsFromLogs = (
  normalizedLogs: NormalizedSessionLog[] = [],
): SessionSummary[] => {
  const sessionMap = new Map<
    string,
    {
      sessionId: string;
      login: NormalizedSessionLog | null;
      logout: NormalizedSessionLog | null;
      firstSeen: number | null;
      lastSeen: number | null;
    }
  >();

  normalizedLogs.forEach((log, index) => {
    const key = getSessionKey(log, index, sessionMap.size);
    const current = sessionMap.get(key) || {
      sessionId: log.sessionId || 'Sin id',
      login: null,
      logout: null,
      firstSeen: log.createdAt || null,
      lastSeen: log.createdAt || null,
    };

    if (log.createdAt) {
      current.firstSeen = Math.min(
        current.firstSeen || log.createdAt,
        log.createdAt,
      );
      current.lastSeen = Math.max(
        current.lastSeen || log.createdAt,
        log.createdAt,
      );
    }

    if (log.event === 'login') {
      if (
        !current.login ||
        (log.createdAt || 0) > (current.login.createdAt || 0)
      ) {
        current.login = log;
      }
    }

    if (END_EVENTS.has(log.event)) {
      if (
        !current.logout ||
        (log.createdAt || 0) > (current.logout.createdAt || 0)
      ) {
        current.logout = log;
      }
    }

    sessionMap.set(key, current);
  });

  const sessions: SessionSummary[] = Array.from(sessionMap.values()).map(
    (session) => {
      const startAt = session.login?.createdAt || session.firstSeen || null;
      const endAt = session.logout?.createdAt || null;
      const durationMs =
        startAt && endAt && endAt >= startAt ? endAt - startAt : null;
      const context = normalizeContext(
        session.login?.context || session.logout?.context,
      );
      const metadata = context.metadata;
      const deviceLabel = formatDeviceLabel({
        deviceLabel:
          context.deviceLabel ||
          metadata.deviceLabel ||
          context.label ||
          metadata.label,
        platform: context.platform || metadata.platform || '',
        userAgent: context.userAgent || metadata.userAgent || '',
      });

      const status = endAt ? 'closed' : 'open';
      const endEvent = session.logout?.event || null;
      const statusLabel = (() => {
        if (status === 'open') return 'Activa';
        if (!endEvent || endEvent === 'logout') return 'Cerrada';
        if (endEvent === 'revoked') return 'Cerrada por administrador';
        if (endEvent === 'auto-revoked') return 'Cerrada (limite de sesiones)';
        if (endEvent === 'idle-timeout' || endEvent === 'idle')
          return 'Cerrada por inactividad';
        if (endEvent === 'expired') return 'Expirada';
        if (endEvent === 'terminated') return 'Cerrada por seguridad';
        return 'Cierre inesperado';
      })();

      return {
        sessionId: session.sessionId,
        startAt,
        endAt,
        durationMs,
        durationDisplay: formatDuration(durationMs),
        startDisplay: formatDateTime(startAt),
        endDisplay: endAt ? formatDateTime(endAt) : statusLabel,
        deviceLabel: deviceLabel || 'Sin datos',
        ipAddress: context.ipAddress || metadata.ipAddress || 'Sin datos',
        status,
        statusLabel,
        endEvent,
        index: 0,
      };
    },
  );

  return sessions
    .sort((a, b) => (b.startAt || 0) - (a.startAt || 0))
    .map((session, index) => ({
      ...session,
      index: index + 1,
    }));
};
