import { Modal } from 'antd';
import { httpsCallable } from 'firebase/functions';
import { doc, getDoc } from 'firebase/firestore';
import { useCallback, useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import {
  INACTIVITY_WARNING,
  SESSION_CHECK_INTERVAL,
  ACTIVITY_CHECK_INTERVAL,
} from '../../../../constants/sessionConfig';
import { login, logout } from '../../../../features/auth/userSlice';
import { db, functions } from '../../../firebaseconfig';
import {
  buildSessionInfo,
  clearStoredSession,
  getStoredSession,
  storeSessionLocally,
} from '../sessionClient';

const refreshSessionCallable = httpsCallable(functions, 'clientRefreshSession');
const logoutCallable = httpsCallable(functions, 'clientLogout');

const EXPIRY_WARNING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h
const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'visibilitychange', 'focus'];

export function useAutomaticLogin() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const modalKeyRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const userIdRef = useRef(null);
  const isMountedRef = useRef(true);
  const refreshLockRef = useRef(false);

  const openModalOnce = useCallback((key, renderModal) => {
    if (modalKeyRef.current) return;
    modalKeyRef.current = key;
    renderModal(() => {
      modalKeyRef.current = null;
    });
  }, []);

  const handleLogout = useCallback(
    async ({ redirect = true } = {}) => {
      const { sessionToken } = getStoredSession();
      if (sessionToken) {
        try {
          await logoutCallable({ sessionToken });
        } catch (error) {
          console.error('logout callable error:', error?.message || error);
        }
      }
      clearStoredSession();
      dispatch(logout());
      if (redirect) {
        navigate('/login', { replace: true });
      }
    },
    [dispatch, navigate]
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
  }, [handleLogout, openModalOnce]);

  const showInactivityWarning = useCallback(() => {
    openModalOnce('inactivity-warning', (reset) => {
      Modal.confirm({
        title: 'Inactividad prolongada',
        content: '¿Deseas mantener tu sesión activa? Se cerrará por inactividad.',
        okText: 'Sí, mantener activa',
        cancelText: 'Cerrar sesión',
        centered: true,
        onOk: () => refreshSession('inactivity-extend'),
        onCancel: () => handleLogout({ redirect: true }),
        afterClose: reset,
      });
    });
  }, [handleLogout, openModalOnce]);

  const loadUserData = useCallback(
    async (userId) => {
      if (!userId || userIdRef.current === userId) return;
      try {
        const userSnapshot = await getDoc(doc(db, 'users', userId));
        if (userSnapshot.exists()) {
          const userData = userSnapshot.data()?.user;
          if (userData) {
            dispatch(
              login({
                uid: userSnapshot.id,
                displayName: userData.realName || userData.name,
                username: userData.name,
                realName: userData.realName,
              })
            );
            userIdRef.current = userId;
          }
        }
      } catch (error) {
        console.error('user data load error:', error?.message || error);
      }
    },
    [dispatch]
  );

  const refreshSession = useCallback(
    async (source = 'auto', options = {}) => {
      if (refreshLockRef.current) return null;
      refreshLockRef.current = true;
      try {
        const { sessionToken } = getStoredSession();
        if (!sessionToken) {
          await handleLogout({ redirect: true });
          return null;
        }

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

        await loadUserData(session.userId);

        const remaining = session.expiresAt ? session.expiresAt - Date.now() : null;
        if (remaining !== null && remaining > 0 && remaining < EXPIRY_WARNING_WINDOW_MS) {
          showSessionExpiringWarning();
        }

        lastActivityRef.current = Date.now();
        return session;
      } catch (error) {
        console.error('session refresh error:', error?.message || error);
        showSessionExpiredModal();
        await handleLogout({ redirect: true });
        return null;
      } finally {
        refreshLockRef.current = false;
      }
    },
    [handleLogout, loadUserData, showSessionExpiredModal, showSessionExpiringWarning]
  );

  const handleActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const init = async () => {
      await refreshSession('initial');
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

  return null;
}
