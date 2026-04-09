import {
  collection,
  onSnapshot,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

interface ChangelogEntry {
  id: string;
  content: string;
  createdAt: Timestamp;
  [key: string]: unknown;
}

interface ChangelogDoc {
  changelog: ChangelogEntry;
  [key: string]: unknown;
}

interface ChangelogWithDate extends Omit<ChangelogDoc, 'changelog'> {
  changelog: Omit<ChangelogEntry, 'createdAt'> & { createdAt: Date };
}

export const useGetChangelogs = () => {
  const [changelogs, setChangelogs] = useState<ChangelogWithDate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;
    try {
      const changelogsRef = collection(db, 'changelogs');
      unsubscribe = onSnapshot(
        changelogsRef,
        (snapshot) => {
          const changelogArray = snapshot.docs.map((docSnap) => {
            const data = docSnap.data() as ChangelogDoc;
            const createdAtSeconds = data?.changelog?.createdAt?.seconds;
            const createdAt =
              typeof createdAtSeconds === 'number'
                ? new Date(createdAtSeconds * 1000)
                : new Date(0);

            return {
              ...data,
              changelog: {
                ...data.changelog,
                createdAt,
              },
            } as ChangelogWithDate;
          });
          setChangelogs(changelogArray);
        },
        (err) => {
          // Manejar error en el callback de onSnapshot
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        },
      );
    } catch (err) {
      console.error('Error al inicializar changelogs:', err);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { changelogs, error };
};
