import {
  Timestamp,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';

interface ChangelogEntry {
  id: string;
  content: string;
  createdAt: Timestamp;
}

const APP_VERSION_DOCUMENT_ID = '3Iz5UZWWfF4vCJPlDSy1';

const updateAppVersion = async (changelogId: string): Promise<void> => {
  const appRef = doc(db, 'app', APP_VERSION_DOCUMENT_ID);
  const appData = {
    version: serverTimestamp(),
    lastChangelog: changelogId,
  };

  await updateDoc(appRef, appData);
};

export const fbAddChangelog = async (jsonString: string): Promise<void> => {
  const changelog: ChangelogEntry = {
    id: nanoid(12),
    content: jsonString,
    createdAt: Timestamp.now(),
  };

  try {
    const changeLogRef = doc(db, 'changelogs', changelog.id);
    await setDoc(changeLogRef, { changelog });
    await updateAppVersion(changelog.id);
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};
