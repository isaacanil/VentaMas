import { doc, getDoc, type Timestamp } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

export interface AppVersionDoc {
  version?: Timestamp | null;
  lastChangelog?: string | null;
  [key: string]: unknown;
}

export const fbGetAppVersion = async (): Promise<AppVersionDoc | null> => {
  const appRef = doc(db, 'app', '3Iz5UZWWfF4vCJPlDSy1');
  const appSnap = await getDoc(appRef);
  if (!appSnap.exists()) {
    return null;
  }

  return appSnap.data() as AppVersionDoc;
};
