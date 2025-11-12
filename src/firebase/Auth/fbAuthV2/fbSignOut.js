import { httpsCallable } from 'firebase/functions';

import { functions } from '../../firebaseconfig';

import {
  clearStoredSession,
  getStoredSession,
  setLogoutInProgress,
} from './sessionClient';

const clientLogoutCallable = httpsCallable(functions, 'clientLogout');

export const fbSignOut = async () => {
  setLogoutInProgress(true);
  try {
    const { sessionToken } = getStoredSession();
    if (sessionToken) {
      try {
        await clientLogoutCallable({ sessionToken });
      } catch (error) {
        console.error('logout error:', error?.message || error);
      }
    }
    clearStoredSession();
  } finally {
    setLogoutInProgress(false);
  }
};
