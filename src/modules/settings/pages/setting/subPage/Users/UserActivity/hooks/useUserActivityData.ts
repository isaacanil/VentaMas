import { onValue, ref } from 'firebase/database';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { fbGetSessionLogs } from '@/firebase/Auth/fbAuthV2/fbGetSessionLogs';
import { fbGetUser } from '@/firebase/Auth/fbGetUser';
import { realtimeDB } from '@/firebase/firebaseconfig';
import type { UserIdentity, UserRoleLike } from '@/types/users';

import {
  buildSessionsFromLogs,
  normalizeContext,
  toMillis,
  type NormalizedSessionLog,
  type PresenceState,
  type SessionLog,
  type SessionSummary,
  type TimestampLike,
} from '../utils/activityUtils';

export type UserActivityUser = UserIdentity & {
  realName?: string;
  displayName?: string;
  username?: string;
  email?: string;
  active?: boolean;
  createAt?: TimestampLike;
  businessID?: string | null;
  businessId?: string | null;
  [key: string]: unknown;
};

export interface UserActivityProfile {
  id: string;
  name: string;
  email: string;
  role: UserRoleLike | string;
  active: boolean;
  createdAt?: TimestampLike;
  businessID: string;
}

interface UseUserActivityDataParams {
  userId: string | null;
  initialUser?: UserActivityUser | null;
  initialPresence?: PresenceState | null;
}

interface UseUserActivityDataResult {
  activityError: string | null;
  errorMessage: string | null;
  lastLogin: NormalizedSessionLog | undefined;
  lastLogout: NormalizedSessionLog | undefined;
  loadActivity: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  loadingLogs: boolean;
  loadingUser: boolean;
  presenceStatus: string;
  resolvedLastSeen: number | null;
  sessions: SessionSummary[];
  showError: boolean;
  statusLabel: string;
  statusTag: string;
  userInfo: UserActivityProfile | null;
}

const mapUserInfo = (userId: string, user?: UserActivityUser | null): UserActivityProfile => ({
  id: userId,
  name:
    user?.realName ||
    user?.displayName ||
    user?.username ||
    user?.name ||
    'Usuario',
  email: user?.email || user?.username || '',
  role: user?.role || '',
  active: Boolean(user?.active),
  createdAt: user?.createAt,
  businessID: user?.businessID || user?.businessId || '',
});

export const useUserActivityData = ({
  userId,
  initialUser = null,
  initialPresence = null,
}: UseUserActivityDataParams): UseUserActivityDataResult => {
  const [userInfo, setUserInfo] = useState<UserActivityProfile | null>(() =>
    initialUser && userId ? mapUserInfo(userId, initialUser) : null,
  );
  const [presence, setPresence] = useState<PresenceState | null>(
    initialPresence,
  );
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingUser, setLoadingUser] = useState(!userInfo);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [activityError, setActivityError] = useState<string | null>(null);

  const loadUserProfile = useCallback(async () => {
    if (!userId) {
      setProfileError('Usuario no valido.');
      setLoadingUser(false);
      return;
    }
    setLoadingUser(true);
    setProfileError(null);
    try {
      const data = await fbGetUser(userId);
      if (data) {
        const baseUser = (data as { user?: UserActivityUser }).user || data;
        setUserInfo(mapUserInfo(userId, baseUser as UserActivityUser));
      } else {
        setProfileError('No se encontro informacion del usuario.');
      }
    } catch (error) {
      setProfileError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el usuario.',
      );
    } finally {
      setLoadingUser(false);
    }
  }, [userId]);

  const loadActivity = useCallback(async () => {
    if (!userId) {
      setActivityError('Usuario no valido.');
      setLoadingLogs(false);
      return;
    }
    setLoadingLogs(true);
    setActivityError(null);
    try {
      const response = await fbGetSessionLogs({ userId, limit: 200 });
      setLogs(response || []);
    } catch (error) {
      setActivityError(
        error instanceof Error
          ? error.message
          : 'No se pudo cargar el historial de actividad.',
      );
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !realtimeDB?.app?.options?.databaseURL) return undefined;

    const presenceRef = ref(realtimeDB, `presence/${userId}`);
    const unsubscribe = onValue(presenceRef, (snapshot) => {
      const value = snapshot?.val() as Record<string, unknown> | null;
      let state = 'offline';
      let lastUpdated = null;

      if (value && typeof value === 'object') {
        const connections = Object.values(value) as Array<
          { state?: string; updatedAt?: TimestampLike }
        >;
        const onlineConnection = connections.find(
          (connection) => connection?.state === 'online',
        );
        state = onlineConnection ? 'online' : 'offline';
        const timestamps = connections
          .map((connection) => toMillis(connection?.updatedAt))
          .filter((ts): ts is number => typeof ts === 'number');
        if (timestamps.length) {
          lastUpdated = Math.max(...timestamps);
        }
      }

      setPresence({
        state,
        status: state,
        lastUpdated,
        updatedAt: lastUpdated,
      });
    });

    return () => {
      try {
        unsubscribe();
      } catch {
        // ignore cleanup errors
      }
    };
  }, [userId]);

  useEffect(() => {
    loadUserProfile();
  }, [loadUserProfile]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  const normalizedLogs = useMemo<NormalizedSessionLog[]>(
    () =>
      (logs || []).map((log) => ({
        ...log,
        createdAt: typeof log.createdAt === 'number' ? log.createdAt : null,
        context: normalizeContext(log.context),
      })),
    [logs],
  );

  const sessions = useMemo<SessionSummary[]>(
    () => buildSessionsFromLogs(normalizedLogs),
    [normalizedLogs],
  );

  const lastLogin = useMemo(
    () => normalizedLogs.find((log) => log.event === 'login'),
    [normalizedLogs],
  );
  const lastLogout = useMemo(
    () => normalizedLogs.find((log) => log.event === 'logout'),
    [normalizedLogs],
  );

  const lastSeen = useMemo(
    () => toMillis(presence?.lastSeen ?? presence?.lastUpdated),
    [presence],
  );
  const presenceUpdatedAt = useMemo(
    () => toMillis(presence?.updatedAt ?? presence?.lastUpdated),
    [presence],
  );
  const resolvedLastSeen =
    lastSeen ||
    presenceUpdatedAt ||
    (lastLogin ? lastLogin.createdAt : null) ||
    (lastLogout ? lastLogout.createdAt : null);
  const presenceStatus = presence?.status || presence?.state || 'offline';
  const statusTag = presenceStatus === 'online' ? 'green' : 'default';
  const statusLabel =
    presenceStatus === 'online' ? 'En linea' : 'Fuera de linea';

  const errorMessage = profileError || activityError;
  const showError = Boolean(errorMessage) && !(loadingLogs || loadingUser);

  return {
    activityError,
    errorMessage,
    lastLogin,
    lastLogout,
    loadActivity,
    loadUserProfile,
    loadingLogs,
    loadingUser,
    presenceStatus,
    resolvedLastSeen,
    sessions,
    showError,
    statusLabel,
    statusTag,
    userInfo,
  };
};
