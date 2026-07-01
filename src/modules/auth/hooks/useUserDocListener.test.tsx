import { configureStore } from '@reduxjs/toolkit';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import userReducer from '@/features/auth/userSlice';

import { useUserDocListener } from './useUserDocListener';

const mocks = vi.hoisted(() => ({
  auth: {
    currentUser: { uid: 'user-1' } as { uid: string } | null,
  },
  doc: vi.fn((_db, collection: string, id: string) => ({
    collection,
    id,
  })),
  onSnapshot: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  doc: mocks.doc,
  onSnapshot: mocks.onSnapshot,
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  auth: mocks.auth,
  db: {},
}));

const createWrapper = () => {
  const store = configureStore({
    reducer: { user: userReducer },
  });

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return { store, Wrapper };
};

describe('useUserDocListener', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.currentUser = { uid: 'user-1' };
    mocks.onSnapshot.mockImplementation((_ref, onNext) => {
      onNext({
        exists: () => false,
      });
      return vi.fn();
    });
  });

  it('does not logout immediately when the user document snapshot is missing', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { store, Wrapper } = createWrapper();

    const { unmount } = renderHook(() => useUserDocListener('user-1'), {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(mocks.onSnapshot).toHaveBeenCalledTimes(1);
    });

    expect(store.getState().user.user).toBeNull();
    expect(store.getState().user.authReady).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      'user doc listener: user document missing; keeping session until refresh validates it.',
    );

    warnSpy.mockRestore();
    unmount();
  });
});
