import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import userReducer from '@/features/auth/userSlice';

import { useAutomaticLogin } from './useAutomaticLogin';

const mocks = vi.hoisted(() => ({
  auth: {
    currentUser: null as { uid: string } | null,
  },
  clearStoredSession: vi.fn(),
  clientLogout: vi.fn(),
  clientRefreshSession: vi.fn(),
  getStoredSession: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signInWithCustomToken: vi.fn(),
  signOut: vi.fn(),
  storeSessionLocally: vi.fn(),
}));

vi.mock('antd', () => ({
  Modal: {
    confirm: vi.fn(),
  },
}));

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: mocks.onAuthStateChanged,
  signInWithCustomToken: mocks.signInWithCustomToken,
  signOut: mocks.signOut,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  auth: mocks.auth,
  db: {},
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  buildSessionInfo: vi.fn(() => ({ deviceId: 'device-1' })),
  clearStoredSession: mocks.clearStoredSession,
  getLastLogoutAt: vi.fn(() => 0),
  getStoredSession: mocks.getStoredSession,
  isLogoutInProgress: vi.fn(() => false),
  storeSessionLocally: mocks.storeSessionLocally,
}));

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: (name: string) => {
    if (name === 'clientRefreshSession') return mocks.clientRefreshSession;
    if (name === 'clientLogout') return mocks.clientLogout;
    return vi.fn();
  },
}));

const createWrapper = (initialEntry = '/bills') => {
  const store = configureStore({
    reducer: { user: userReducer },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>
    </Provider>
  );

  return { store, Wrapper };
};

describe('useAutomaticLogin', () => {
  beforeEach(() => {
    mocks.auth.currentUser = null;
    mocks.getStoredSession.mockReturnValue({
      deviceId: 'device-1',
      sessionExpiresAt: Date.now() + 60_000,
      sessionId: 'session-1',
      sessionToken: 'token-1',
    });
    mocks.clientRefreshSession.mockRejectedValue({
      code: 'functions/internal',
      message: 'internal',
    });
    mocks.onAuthStateChanged.mockImplementation((_auth, onNext) => {
      onNext(null);
      return vi.fn();
    });
    mocks.clientLogout.mockResolvedValue({ ok: true });
    mocks.signInWithCustomToken.mockResolvedValue(undefined);
    mocks.signOut.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('keeps protected routes pending when the initial refresh fails transiently', async () => {
    const { store, Wrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mocks.clientRefreshSession).toHaveBeenCalledTimes(1);
      expect(result.current.error?.message).toBe('internal');
    });

    expect(result.current.status).toBe('checking');
    expect(store.getState().user.authReady).toBe(false);
    expect(store.getState().user.user).toBeNull();

    unmount();
  });

  it('keeps protected routes pending for recoverable auth-like refresh errors', async () => {
    mocks.clientRefreshSession.mockRejectedValue({
      code: 'functions/permission-denied',
      message: 'App Check token is invalid.',
    });

    const { store, Wrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mocks.clientRefreshSession).toHaveBeenCalledTimes(1);
      expect(result.current.error?.message).toBe(
        'App Check token is invalid.',
      );
    });

    expect(result.current.status).toBe('checking');
    expect(store.getState().user.authReady).toBe(false);
    expect(mocks.clearStoredSession).not.toHaveBeenCalled();
    expect(mocks.clientLogout).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();

    unmount();
  });

  it('logs out when the refresh reports a terminal expired session', async () => {
    mocks.clientRefreshSession.mockRejectedValue({
      code: 'functions/unauthenticated',
      message: 'La sesión ha expirado',
    });

    const { store, Wrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mocks.clearStoredSession).toHaveBeenCalled();
    });

    expect(mocks.clientLogout).toHaveBeenCalledWith({
      sessionToken: 'token-1',
    });
    expect(mocks.signOut).toHaveBeenCalled();
    expect(result.current.sessionExpiredDialogOpen).toBe(true);
    expect(result.current.status).toBe('ready');
    expect(store.getState().user.authReady).toBe(true);
    expect(store.getState().user.user).toBeNull();

    unmount();
  });

  it('silently clears stale sessions while already on the login route', async () => {
    mocks.clientRefreshSession.mockRejectedValue({
      code: 'functions/unauthenticated',
      message: 'Sesión no encontrada',
    });

    const { store, Wrapper } = createWrapper('/login');
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mocks.clearStoredSession).toHaveBeenCalled();
    });

    expect(mocks.signOut).toHaveBeenCalled();
    expect(result.current.sessionExpiredDialogOpen).toBe(false);
    expect(result.current.status).toBe('ready');
    expect(store.getState().user.authReady).toBe(true);
    expect(store.getState().user.user).toBeNull();

    unmount();
  });

  it('does not show the expired-session dialog for stale tokens missing on the backend', async () => {
    mocks.clientRefreshSession.mockRejectedValue({
      code: 'functions/unauthenticated',
      message: 'Sesión no encontrada',
    });

    const { store, Wrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mocks.clearStoredSession).toHaveBeenCalled();
    });

    expect(mocks.signOut).toHaveBeenCalled();
    expect(result.current.sessionExpiredDialogOpen).toBe(false);
    expect(result.current.status).toBe('ready');
    expect(store.getState().user.authReady).toBe(true);
    expect(store.getState().user.user).toBeNull();

    unmount();
  });

  it('accepts refresh without a custom token when Firebase Auth hydrates the user', async () => {
    mocks.clientRefreshSession.mockResolvedValue({
      ok: true,
      businessHasOwners: true,
      session: {
        expiresAt: Date.now() + 60_000,
        id: 'session-1',
        userId: 'user-1',
      },
      user: {
        activeBusinessId: 'business-1',
        activeRole: 'admin',
        name: 'Grequis',
      },
    });
    mocks.onAuthStateChanged.mockImplementation((_auth, onNext) => {
      onNext({ uid: 'user-1' });
      return vi.fn();
    });

    const { store, Wrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(store.getState().user.user?.uid).toBe('user-1');
    });

    expect(result.current.status).toBe('ready');
    expect(store.getState().user.authReady).toBe(true);
    expect(mocks.signInWithCustomToken).not.toHaveBeenCalled();
    expect(mocks.clearStoredSession).not.toHaveBeenCalled();

    unmount();
  });

  it('keeps the session pending when refresh succeeds but Firebase Auth cannot hydrate', async () => {
    mocks.clientRefreshSession.mockResolvedValue({
      ok: true,
      session: {
        expiresAt: Date.now() + 60_000,
        id: 'session-1',
        userId: 'user-1',
      },
      user: {
        activeBusinessId: 'business-1',
        activeRole: 'admin',
        name: 'Grequis',
      },
    });

    const { store, Wrapper } = createWrapper();
    const { result, unmount } = renderHook(() => useAutomaticLogin(), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(result.current.error?.message).toContain('firebaseCustomToken');
    });

    expect(result.current.status).toBe('checking');
    expect(store.getState().user.authReady).toBe(false);
    expect(store.getState().user.user).toBeNull();
    expect(mocks.clearStoredSession).not.toHaveBeenCalled();
    expect(mocks.signOut).not.toHaveBeenCalled();

    unmount();
  });
});
