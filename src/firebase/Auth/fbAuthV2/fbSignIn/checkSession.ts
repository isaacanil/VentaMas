import { Modal } from 'antd';
import { signInWithCustomToken, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  INACTIVITY_WARNING,
  SESSION_CHECK_INTERVAL,
  ACTIVITY_CHECK_INTERVAL,
} from '@/constants/sessionConfig';
import {
  addUserData,
  login,
  logout,
  setAuthReady,
} from '@/features/auth/userSlice';
import {
  buildSessionInfo,
  clearStoredSession,
  getStoredSession,
  getLastLogoutAt,
  isLogoutInProgress,
  storeSessionLocally,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { auth, db, functions } from '@/firebase/firebaseconfig';
import { normalizeCurrentUserContext } from '@/utils/auth-adapter';

const EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const RETRY_DELAYS_MS = [2000, 5000];

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'visibilitychange',
  'focus',
];

const AUTH_ERROR_CODES = [
  'unauthenticated',
  'permission-denied',
  'invalid-argument',
];

const TRANSIENT_SESSION_ERROR_CODES = [
  'deadline-exceeded',
  'unavailable',
  'resource-exhausted',
  'aborted',
  'internal',
];

type SessionStatus = 'idle' | 'checking' | 'ready';

type RefreshOptions = {
  extend?: boolean;
};

type SessionData = {
  id?: string;
  expiresAt?: number;
  userId?: string;
  [key: string]: unknown;
};

type SessionUserPayload = Record<string, unknown>;

type RefreshResult = {
  ok: boolean;
  reason?: string;
  session?: SessionData;
  error?: unknown;
};

type SessionCallableResponse = {
  ok?: boolean;
  message?: string;
  session?: SessionData;
  businessHasOwners?: boolean;
  user?: SessionUserPayload;
  firebaseCustomToken?: string;
};

type RefreshSessionRequest = {
  sessionToken: string;
  extend: boolean;
  sessionInfo: ReturnType<typeof buildSessionInfo>;
};

const toLegacyCompatibleAuthPayload = (
  userId: string,
  userData: Record<string, unknown>,
) => {
  const normalized = normalizeCurrentUserContext({
    id: userId,
    uid: userId,
    ...userData,
  });

  const uid = normalized.uid || userId;

  const username =
    (typeof userData.name === 'string' && userData.name) || undefined;

  const realName =
    (typeof userData.realName === 'string' && userData.realName) || undefined;

  return {
    uid,
    id: uid,
    displayName: normalized.displayName || username,
    username,
    realName,
    email: normalized.email || undefined,
    role: normalized.activeRole || undefined,
    businessID: normalized.activeBusinessId || undefined,
    businessId: normalized.activeBusinessId || undefined,
    activeBusinessId: normalized.activeBusinessId || undefined,
    defaultBusinessId: normalized.defaultBusinessId || undefined,
    lastSelectedBusinessId: normalized.lastSelectedBusinessId || undefined,
    availableBusinesses: normalized.availableBusinesses,
    accessControl: normalized.accessControl,
    memberships: normalized.memberships,
    hasMultipleBusinesses: normalized.hasMultipleBusinesses,
    isLegacyUser: normalized.isLegacyUser,
    contextSource: normalized.source,
    devBusinessSimulation:
      userData.devBusinessSimulation &&
      typeof userData.devBusinessSimulation === 'object'
        ? userData.devBusinessSimulation
        : undefined,
  };
};

const getErrorCode = (error: unknown): string => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code?: unknown }).code === 'string'
  ) {
    return (error as { code: string }).code;
  }
  return '';
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message?: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return '';
};

const isAuthError = (error: unknown): boolean => {
  const code = getErrorCode(error).toLowerCase();
  return AUTH_ERROR_CODES.some((errCode) => code.includes(errCode));
};

const isTransientSessionError = (error: unknown): boolean => {
  const code = getErrorCode(error).toLowerCase();
  const message = getErrorMessage(error).toLowerCase();

  const hasTransientCode = TRANSIENT_SESSION_ERROR_CODES.some((errCode) =>
    code.includes(errCode),
  );
  if (hasTransientCode) return true;

  const transientMessageHints = [
    'network',
    'conexion',
    'timeout',
    'unavailable',
    'temporarily',
    'offline',
  ];

  return transientMessageHints.some((hint) => message.includes(hint));
};

const ensureFirebaseAuthSession = async (
  userId: string | null | undefined,
  firebaseCustomToken: unknown,
): Promise<void> => {
  if (!userId) {
    throw new Error('Sesion inválida: faltó userId.');
  }

  const currentUser = auth.currentUser;
  if (currentUser?.uid === userId) return;

  if (typeof firebaseCustomToken !== 'string' || !firebaseCustomToken.trim()) {
    throw new Error('Sesion inválida: faltó firebaseCustomToken.');
  }

  if (currentUser) {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('firebase signOut error:', error);
    }
  }

  await signInWithCustomToken(auth, firebaseCustomToken);
};

export function useAutomaticLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const modalKeyRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const userIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const refreshLockRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryWarningShownRef = useRef(false);
  const refreshSessionRef = useRef<
    ((source?: string, options?: RefreshOptions) => Promise<RefreshResult>) | null
  >(null);
  const [status, setStatus] = useState<SessionStatus>('checking');
  const [error, setError] = useState<Error | null>(null);

  const openModalOnce = useCallback(
    (key: string, renderModal: (reset: () => void) => void) => {
      if (modalKeyRef.current) return;
      modalKeyRef.current = key;
      renderModal(() => {
        modalKeyRef.current = null;
      });
    },
    [],
  );

  const clearRetryTimer = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  const resetRetryState = useCallback(() => {
    retryCountRef.current = 0;
    retryWarningShownRef.current = false;
    clearRetryTimer();
  }, [clearRetryTimer]);

  const scheduleRetry = useCallback(
    (source: string) => {
      if (!isMountedRef.current) return;
      clearRetryTimer();

      retryCountRef.current += 1;
      const attempt = retryCountRef.current;
      let delay = SESSION_CHECK_INTERVAL;

      if (attempt === 1) {
        delay = RETRY_DELAYS_MS[0];
      } else if (attempt === 2) {
        delay = RETRY_DELAYS_MS[1];
      } else if (!retryWarningShownRef.current) {
        retryWarningShownRef.current = true;
        console.warn(
          'Sin conexion. Mantendremos tu sesion local mientras reintentamos.',
        );
      }

      retryTimeoutRef.current = setTimeout(() => {
        refreshSessionRef.current?.(`${source}-retry`);
      }, delay);
    },
    [clearRetryTimer],
  );

  const handleLogout = useCallback(
    async ({ redirect = true }: { redirect?: boolean } = {}) => {
      if (isMountedRef.current) {
        setStatus('ready');
        setError(null);
      }

      resetRetryState();

      const { sessionToken } = getStoredSession();
      if (sessionToken) {
        try {
          const logoutCallable = httpsCallable<
            { sessionToken: string },
            { ok?: boolean; message?: string }
          >(functions, 'clientLogout');
          await logoutCallable({ sessionToken });
        } catch (logoutError) {
          console.error(
            'logout callable error:',
            getErrorMessage(logoutError) || logoutError,
          );
        }
      }
      userIdRef.current = null;
      clearStoredSession();
      try {
        await signOut(auth);
      } catch (error) {
        console.warn('firebase signOut error:', error);
      }
      dispatch(logout());
      if (redirect) {
        navigate('/login', { replace: true });
      }
    },
    [dispatch, navigate, resetRetryState],
  );

  const loadUserData = useCallback(
    async (userId: string | null, sessionUser?: SessionUserPayload) => {
      if (!userId) return;

      if (sessionUser && typeof sessionUser === 'object') {
        dispatch(login(toLegacyCompatibleAuthPayload(userId, sessionUser)));
        userIdRef.current = userId;
        return;
      }

      if (userIdRef.current === userId) return;
      try {
        const userSnapshot = await getDoc(doc(db, 'users', userId));
        if (userSnapshot.exists()) {
          const rawUserData = userSnapshot.data() as Record<string, unknown>;
          dispatch(
            login(toLegacyCompatibleAuthPayload(userSnapshot.id, rawUserData)),
          );
          userIdRef.current = userId;
        }
      } catch (loadError) {
        if (getErrorCode(loadError).toLowerCase().includes('permission-denied')) {
          return;
        }
        console.error(
          'user data load error:',
          getErrorMessage(loadError) || loadError,
        );
      }
    },
    [dispatch],
  );

  const showSessionExpiredModal = useCallback(() => {
    openModalOnce('session-expired', (reset) => {
      Modal.warning({
        title: 'Sesion expirada',
        content: 'Tu sesion ha expirado. Por favor, inicia sesion nuevamente.',
        okText: 'Aceptar',
        centered: true,
        maskClosable: false,
        keyboard: false,
        onOk: () => handleLogout({ redirect: true }),
        afterClose: reset,
      });
    });
  }, [handleLogout, openModalOnce]);

  const refreshSession = useCallback(
    async (
      source = 'auto',
      options: RefreshOptions = {},
    ): Promise<RefreshResult> => {
      if (refreshLockRef.current) {
        return { ok: false, reason: 'locked' };
      }
      refreshLockRef.current = true;
      try {
        const { sessionToken } = getStoredSession();
        if (!sessionToken) {
          if (isLogoutInProgress() || Date.now() - getLastLogoutAt() < 3000) {
            if (isMountedRef.current) {
              setStatus('ready');
              setError(null);
            }
            userIdRef.current = null;
            return { ok: false, reason: 'logout-in-progress' };
          }

          await handleLogout({ redirect: false });
          return { ok: false, reason: 'missing-token' };
        }

        const refreshSessionCallable = httpsCallable<
          RefreshSessionRequest,
          SessionCallableResponse
        >(functions, 'clientRefreshSession');
        const response = await refreshSessionCallable({
          sessionToken,
          extend: options.extend !== false,
          sessionInfo: buildSessionInfo({
            metadata: {
              refreshSource: source,
              lastActivityMs: Date.now() - lastActivityRef.current,
            },
          }),
        });

        const data = response?.data || {};
        if (!data.ok || !data.session) {
          throw new Error(data?.message || 'Sesion invalida');
        }

        const { session } = data;
        storeSessionLocally({
          sessionToken,
          sessionExpiresAt: session.expiresAt,
          sessionId: session.id,
        });

        if (typeof data.businessHasOwners === 'boolean') {
          dispatch(addUserData({ businessHasOwners: data.businessHasOwners }));
        }

        if (isMountedRef.current) {
          setError(null);
        }

        await ensureFirebaseAuthSession(session.userId, data.firebaseCustomToken);

        await loadUserData(
          session.userId,
          data.user && typeof data.user === 'object'
            ? (data.user as SessionUserPayload)
            : undefined,
        );

        const remaining =
          typeof session.expiresAt === 'number'
            ? session.expiresAt - Date.now()
            : null;
        if (
          remaining !== null &&
          remaining > 0 &&
          remaining < EXPIRY_WARNING_WINDOW_MS
        ) {
          showSessionExpiringWarningRef.current?.();
        }

        lastActivityRef.current = Date.now();
        resetRetryState();
        return { ok: true, session };
      } catch (refreshError) {
        console.error(
          'session refresh error:',
          getErrorMessage(refreshError) || refreshError,
        );

        if (isLogoutInProgress() || Date.now() - getLastLogoutAt() < 3000) {
          if (isMountedRef.current) {
            setStatus('ready');
            setError(null);
          }
          return {
            ok: false,
            reason: 'logout-in-progress',
            error: refreshError,
          };
        }

        if (isAuthError(refreshError)) {
          showSessionExpiredModal();
          await handleLogout({ redirect: true });
          return { ok: false, reason: 'invalid-session', error: refreshError };
        }

        if (isMountedRef.current) {
          const message = isTransientSessionError(refreshError)
            ? 'No se pudo renovar la sesion. Reintentaremos pronto.'
            : 'No se pudo renovar la sesion.';
          setError(
            refreshError instanceof Error ? refreshError : new Error(message),
          );
          setStatus('ready');
        }

        scheduleRetry(source);
        return {
          ok: false,
          reason: isTransientSessionError(refreshError)
            ? 'transient-error'
            : 'error',
          error: refreshError,
        };
      } finally {
        refreshLockRef.current = false;
      }
    },
    [
      dispatch,
      handleLogout,
      loadUserData,
      resetRetryState,
      scheduleRetry,
      showSessionExpiredModal,
    ],
  );

  refreshSessionRef.current = refreshSession;

  const showSessionExpiringWarning = useCallback(() => {
    openModalOnce('session-expiring', (reset) => {
      Modal.confirm({
        title: 'Sesion por expirar',
        content: 'Tu sesion expirara pronto. Deseas mantenerla activa?',
        okText: 'Mantener activa',
        cancelText: 'Cerrar sesion',
        centered: true,
        onOk: () => refreshSession('manual-renew'),
        onCancel: () => handleLogout({ redirect: true }),
        afterClose: reset,
      });
    });
  }, [handleLogout, openModalOnce, refreshSession]);

  const showInactivityWarning = useCallback(() => {
    openModalOnce('inactivity-warning', (reset) => {
      Modal.confirm({
        title: 'Inactividad prolongada',
        content:
          'Deseas mantener tu sesion activa? Se cerrara por inactividad.',
        okText: 'Si, mantener activa',
        cancelText: 'Cerrar sesion',
        centered: true,
        onOk: () => refreshSession('inactivity-extend'),
        onCancel: () => handleLogout({ redirect: true }),
        afterClose: reset,
      });
    });
  }, [handleLogout, openModalOnce, refreshSession]);

  const showSessionExpiringWarningRef = useRef<(() => void) | null>(null);
  showSessionExpiringWarningRef.current = showSessionExpiringWarning;

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const setStatusSafe = (value: SessionStatus) => {
      if (isMountedRef.current) {
        setStatus(value);
      }
    };

    const setErrorSafe = (value: Error | null) => {
      if (isMountedRef.current) {
        setError(value);
      }
    };

    const init = async () => {
      setStatusSafe('checking');
      setErrorSafe(null);

      try {
        const result = await refreshSession('initial');
        if (!isMountedRef.current) return;

        if (!result?.ok) {
          // Si está locked, otra llamada init ya está en progreso y se encargará
          // de despachar setAuthReady cuando termine. No hacer nada aquí.
          if (result?.reason === 'locked') return;

          if (
            ['error', 'transient-error'].includes(result?.reason || '') &&
            result.error
          ) {
            const err =
              result.error instanceof Error
                ? result.error
                : new Error(getErrorMessage(result.error) || 'Error de sesion');
            setErrorSafe(err);
          }
          dispatch(setAuthReady());
          setStatusSafe('ready');
          return;
        }

        setErrorSafe(null);
        dispatch(setAuthReady());
        setStatusSafe('ready');
      } catch (initError) {
        console.error('initial session check error:', initError);
        setErrorSafe(
          initError instanceof Error
            ? initError
            : new Error('Error de sesion desconocido'),
        );
        dispatch(setAuthReady());
        setStatusSafe('ready');
      }
    };

    init();

    const refreshInterval = setInterval(() => {
      refreshSession('interval');
    }, SESSION_CHECK_INTERVAL);

    const inactivityInterval = setInterval(() => {
      const inactiveMs = Date.now() - lastActivityRef.current;
      if (inactiveMs > INACTIVITY_WARNING) {
        showInactivityWarning();
      }
    }, ACTIVITY_CHECK_INTERVAL);

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      isMountedRef.current = false;
      refreshLockRef.current = false;
      clearRetryTimer();
      clearInterval(refreshInterval);
      clearInterval(inactivityInterval);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      modalKeyRef.current = null;
    };
  }, [
    clearRetryTimer,
    dispatch,
    handleActivity,
    refreshSession,
    showInactivityWarning,
  ]);

  return { status, error };
}
