import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const useFbGetProviders = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser);

  useEffect(() => {
    if (!user || !user?.businessID) {
      setLoading(false);
      return;
    }

    const providersRef = collection(
      db,
      'businesses',
      user.businessID,
      'providers',
    );

    const fetchData = async () => {
      setLoading(true);

      try {
        const unsubscribe = onSnapshot(providersRef, (snapshot) => {
          let providersArray = snapshot.docs.map((item) => item.data());
          setProviders(providersArray);
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (error) {
        console.error('Error fetching providers:', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { providers, loading };
};
