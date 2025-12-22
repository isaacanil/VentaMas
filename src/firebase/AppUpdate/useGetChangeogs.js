import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../firebaseconfig';

export const useGetChangelogs = () => {
  const [changelogs, setChangelogs] = useState([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let unsubscribe;
    try {
      const changelogsRef = collection(db, 'changelogs');
      unsubscribe = onSnapshot(
        changelogsRef,
        (snapshot) => {
          const changelogArray = snapshot.docs.map((doc) => {
            const data = doc.data();
            const createdAt = new Date(data?.changelog?.createdAt.seconds * 1000);
            return {
              ...data,
              changelog: {
                ...data.changelog,
                createdAt: createdAt,
              },
            };
          });
          setChangelogs(changelogArray);
        },
        (err) => {
          // Manejar error en el callback de onSnapshot
          setError(err);
        }
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
