import { Modal } from 'antd';
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
import { login, logout } from '@/features/auth/userSlice';
import {
  buildSessionInfo,
  clearStoredSession,
  getStoredSession,
  getLastLogoutAt,
  isLogoutInProgress,
  storeSessionLocally,
} from '@/firebase/Auth/fbAuthV2/sessionClient';
import { db, functions } from '@/firebase/firebaseconfig';

const EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

const ACTIVITY_EVENTS = [
  'mousedown',
  'keydown',
  'scroll',
  'touchstart',
  'visibilitychange',
  'focus',
];

const INVALID_SESSION_ERROR_CODES = [
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
};

type RefreshSessionRequest = {
  sessionToken: string;
  extend: boolean;
  sessionInfo: ReturnType<typeof buildSessionInfo>;
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

const isInvalidSessionError = (error: unknown): boolean => {
  const code = getErrorCode(error).toLowerCase();
  const message = getErrorMessage(error).toLowerCase();

  const hasInvalidCode = INVALID_SESSION_ERROR_CODES.some((errCode) =>
    code.includes(errCode),
  );
  if (hasInvalidCode) return true;

  const invalidMessageHints = [
    'expir',
    'inactividad',
    'sesión no encontrada',
    'session not found',
    'token de sesión',
    'token invalido',
    'invalid token',
  ];

  return invalidMessageHints.some((hint) => message.includes(hint));
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
    'conexión',
    'timeout',
    'unavailable',
    'temporarily',
    'offline',
  ];

  return transientMessageHints.some((hint) => message.includes(hint));
};

export function useAutomaticLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const modalKeyRef = useRef<string | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const userIdRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const refreshLockRef = useRef(false);
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [error, setError] = useState<Error | null>(null);

  const openModalOnce = useCallback(
    (key: string, renderModal: (reset: () => void) => void) => {
    if (modalKeyRef.current) return;
    modalKeyRef.current = key;
    renderModal(() => {
      modalKeyRef.current = null;
    });
  }, []);

  const handleLogout = useCallback(
    async ({ redirect = true }: { redirect?: boolean } = {}) => {
      if (isMountedRef.current) {
        setStatus('ready');
        setError(null);
      }

      const { sessionToken } = getStoredSession();
      if (sessionToken) {
        try {
          const logoutCallable = httpsCallable<
            { sessionToken: string },
            { ok?: boolean; message?: string }
          >(functions, 'clientLogout');
          await logoutCallable({ sessionToken });
        } catch (error) {
          console.error('logout callable error:', getErrorMessage(error) || error);
        }
      }
      userIdRef.current = null;
      clearStoredSession();
      dispatch(logout());
      if (redirect) {
        navigate('/login', { replace: true });
      }
    },
    [dispatch, navigate],
  );

  const loadUserData = useCallback(
    async (userId: string | null) => {
      if (!userId || userIdRef.current === userId) return;
      try {
        const userSnapshot = await getDoc(doc(db, 'users', userId));
        if (userSnapshot.exists()) {
          const userData = (userSnapshot.data() as { user?: Record<string, unknown> | null })?.user;
          if (userData) {
            dispatch(
              login({
                uid: userSnapshot.id,
                displayName: (userData as { realName?: string; name?: string }).realName ||
                  (userData as { name?: string }).name,
                username: (userData as { name?: string }).name,
                realName: (userData as { realName?: string }).realName,
              }),
            );
            userIdRef.current = userId;
          }
        }
      } catch (error) {
        console.error('user data load error:', getErrorMessage(error) || error);
      }
    },
    [dispatch],
  );

  const showSessionExpiredModal = useCallback(() => {
    openModalOnce('session-expired', (reset) => {
      Modal.warning({
        title: 'Sesión expirada',
        content: 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
        okText: 'Aceptar',
        centered: true,
        maskClosable: false,
        keyboard: false,
        onOk: () => handleLogout({ redirect: true }),
        afterClose: reset,
      });
    });
  }, [handleLogout, openModalOnce]);

  // Define refreshSession before callbacks that use it
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
          throw new Error(data?.message || 'Sesión inválida');
        }

        const { session } = data;
        storeSessionLocally({
          sessionToken,
          sessionExpiresAt: session.expiresAt,
          sessionId: session.id,
        });

        if (isMountedRef.current) {
          setError(null);
        }

        await loadUserData(session.userId);

        const remaining =
          typeof session.expiresAt === 'number'
            ? session.expiresAt - Date.now()
            : null;
        if (
          remaining !== null &&
          remaining > 0 &&
          remaining < EXPIRY_WARNING_WINDOW_MS
        ) {
          // Call showSessionExpiringWarning after it's defined
          showSessionExpiringWarningRef.current?.();
        }

        lastActivityRef.current = Date.now();
        return { ok: true, session };
      } catch (error) {
        console.error('session refresh error:', getErrorMessage(error) || error);
        if (isLogoutInProgress() || Date.now() - getLastLogoutAt() < 3000) {
          if (isMountedRef.current) {
            setStatus('ready');
            setError(null);
          }
          return { ok: false, reason: 'logout-in-progress', error };
        }

        if (isTransientSessionError(error)) {
          if (isMountedRef.current) {
            setStatus('ready');
            setError(
              error instanceof Error
                ? error
                : new Error(
                    'No se pudo renovar la sesión. Reintentaremos en unos minutos.',
                  ),
            );
          }
          return { ok: false, reason: 'transient-error', error };
        }

        if (isInvalidSessionError(error)) {
          showSessionExpiredModal();
          await handleLogout({ redirect: true });
          return { ok: false, reason: 'invalid-session', error };
        }

        if (isMountedRef.current) {
          setError(
            error instanceof Error
              ? error
              : new Error('No se pudo renovar la sesión.'),
          );
        }
        return { ok: false, reason: 'error', error };
      } finally {
        refreshLockRef.current = false;
      }
    },
    [
      handleLogout,
      loadUserData,
      showSessionExpiredModal,
    ],
  );

  const showSessionExpiringWarning = useCallback(() => {
    openModalOnce('session-expiring', (reset) => {
      Modal.confirm({
        title: 'Sesión por expirar',
        content: 'Tu sesión expirará pronto. ¿Deseas mantenerla activa?',
        okText: 'Mantener activa',
        cancelText: 'Cerrar sesión',
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
          '¿Deseas mantener tu sesión activa? Se cerrará por inactividad.',
        okText: 'Sí, mantener activa',
        cancelText: 'Cerrar sesión',
        centered: true,
        onOk: () => refreshSession('inactivity-extend'),
        onCancel: () => handleLogout({ redirect: true }),
        afterClose: reset,
      });
    });
  }, [handleLogout, openModalOnce, refreshSession]);

  // Store ref to showSessionExpiringWarning for use in refreshSession
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
          if (
            ['error', 'transient-error'].includes(result?.reason) &&
            result.error
          ) {
            const err =
              result.error instanceof Error
                ? result.error
                : new Error(getErrorMessage(result.error) || 'Error de sesión');
            setErrorSafe(err);
          }
          setStatusSafe('ready');
          return;
        }

        setErrorSafe(null);
        setStatusSafe('ready');
      } catch (err) {
        console.error('initial session check error:', err);
        setErrorSafe(
          err instanceof Error ? err : new Error('Error de sesión desconocido'),
        );
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
      clearInterval(refreshInterval);
      clearInterval(inactivityInterval);
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      modalKeyRef.current = null;
    };
  }, [handleActivity, refreshSession, showInactivityWarning]);

  return { status, error };
}
