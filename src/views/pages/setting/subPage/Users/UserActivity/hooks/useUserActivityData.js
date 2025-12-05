import { useCallback, useEffect, useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';

import { fbGetSessionLogs } from '../../../../../../../firebase/Auth/fbAuthV2/fbGetSessionLogs';
import { fbGetUser } from '../../../../../../../firebase/Auth/fbGetUser';
import { realtimeDB } from '../../../../../../../firebase/firebaseconfig';
import {
  buildSessionsFromLogs,
  normalizeContext,
  toMillis,
} from '../utils/activityUtils';

const mapUserInfo = (userId, user) => ({
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
}) => {
  const [userInfo, setUserInfo] = useState(() =>
    initialUser ? mapUserInfo(userId, initialUser) : null,
  );
  const [presence, setPresence] = useState(initialPresence);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadingUser, setLoadingUser] = useState(!userInfo);
  const [profileError, setProfileError] = useState(null);
  const [activityError, setActivityError] = useState(null);

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
        const baseUser = data.user || data;
        setUserInfo(mapUserInfo(userId, baseUser));
      } else {
        setProfileError('No se encontro informacion del usuario.');
      }
    } catch (error) {
      setProfileError(error?.message || 'No se pudo cargar el usuario.');
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
        error?.message || 'No se pudo cargar el historial de actividad.',
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
      const value = snapshot?.val();
      let state = 'offline';
      let lastUpdated = null;

      if (value && typeof value === 'object') {
        const connections = Object.values(value);
        const onlineConnection = connections.find(
          (connection) => connection?.state === 'online',
        );
        state = onlineConnection ? 'online' : 'offline';
        const timestamps = connections
          .map((connection) => toMillis(connection?.updatedAt))
          .filter((ts) => typeof ts === 'number');
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
      } catch (e) {
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

  const normalizedLogs = useMemo(
    () =>
      (logs || []).map((log) => ({
        ...log,
        createdAt: typeof log.createdAt === 'number' ? log.createdAt : null,
        context: normalizeContext(log.context),
      })),
    [logs],
  );

  const sessions = useMemo(
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
  const showError = errorMessage && !(loadingLogs || loadingUser);

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
