import { createFirebaseCallable } from '@/firebase/functions/callable';

import {
  clearStoredSession,
  getStoredSession,
  setLogoutInProgress,
} from './sessionClient';

type LogoutRequest = {
  sessionToken: string;
};

type LogoutResponse = {
  ok?: boolean;
  message?: string;
};

const clientLogoutCallable = createFirebaseCallable<
  LogoutRequest,
  LogoutResponse
>('clientLogout');

export const fbSignOut = async (): Promise<void> => {
  setLogoutInProgress(true);
  try {
    const { sessionToken } = getStoredSession();
    if (sessionToken) {
      try {
        await clientLogoutCallable({ sessionToken });
      } catch (error) {
        const message = error instanceof Error ? error.message : error;
        console.error('logout error:', message);
      }
    }
    clearStoredSession();
  } finally {
    setLogoutInProgress(false);
  }
};
