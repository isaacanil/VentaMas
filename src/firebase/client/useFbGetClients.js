import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

import {
  CLIENT_ROOT_FIELDS,
  extractNormalizedClient,
} from './clientNormalizer';

export const useFbGetClients = ({ includeDeleted = false } = {}) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser);
  useEffect(() => {
    if (!user || !user.businessID) {
      setLoading(false);
      return;
    }

    const { businessID } = user;
    const clientRef = collection(db, 'businesses', businessID, 'clients');
    const q = query(clientRef, orderBy('client.name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setClients([]);
        setLoading(false);
        return;
      }
      const clientArray = snapshot.docs.reduce((acc, docSnap) => {
        const data = docSnap.data() || {};
        const isDeleted = Boolean(data.isDeleted);
        if (!includeDeleted && isDeleted) return acc;

        const client = extractNormalizedClient(data);
        const extras = {};

        for (const [key, value] of Object.entries(data)) {
          if (key === 'client') continue;
          if (!CLIENT_ROOT_FIELDS.has(key)) {
            extras[key] = value;
          }
        }

        acc.push({
          id: docSnap.id,
          isDeleted,
          ...extras,
          client,
        });
        return acc;
      }, []);

      setClients(clientArray);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  return { clients, loading };
};
