import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { fbUpdateAppVersion } from '@/firebase/app/fbUpdateAppVersion';
import { db } from '@/firebase/firebaseconfig';

interface ChangelogEntry {
  id: string;
  content: string;
  createdAt: Timestamp;
}

export const fbAddChangelog = async (jsonString: string): Promise<void> => {
  const changelog: ChangelogEntry = {
    id: nanoid(12),
    content: jsonString,
    createdAt: Timestamp.now(),
  };
  try {
    const changeLogRef = doc(db, 'changelogs', changelog.id);
    await setDoc(changeLogRef, { changelog });
    await fbUpdateAppVersion(changelog.id);
  } catch (error) {
    console.error('Error adding document: ', error);
    throw error;
  }
};
