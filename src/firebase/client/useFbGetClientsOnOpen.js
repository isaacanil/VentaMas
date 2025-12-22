import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

import {
  CLIENT_ROOT_FIELDS,
  extractNormalizedClient,
} from './clientNormalizer';

export const useFbGetClientsOnOpen = ({ isOpen }) => {
  const user = useSelector(selectUser);
  const businessID = user?.businessID ?? null;

  const [clientsState, setClientsState] = useState(() => ({
    businessID: null,
    clients: [],
  }));

  useEffect(() => {
    if (!isOpen || !businessID) {
      return undefined;
    }

    const clientRef = collection(db, 'businesses', businessID, 'clients');
    const q = query(clientRef, orderBy('client.name', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.reduce((acc, doc) => {
          const data = doc.data() || {};
          if (data.isDeleted) return acc;

          const client = extractNormalizedClient(data);
          const extras = {};

          for (const [key, value] of Object.entries(data)) {
            if (key === 'client') continue;
            if (!CLIENT_ROOT_FIELDS.has(key)) {
              extras[key] = value;
            }
          }

          acc.push({
            id: doc.id,
            ...extras,
            client,
          });
          return acc;
        }, []);

        setClientsState({ businessID, clients: list });
      },
      (err) => {
        console.error('Firestore listener error:', err);
        setClientsState((prev) =>
          prev.businessID === businessID ? prev : { businessID, clients: [] },
        );
      },
    );

    return () => {
      unsubscribe();
    };
  }, [isOpen, businessID]);

  const clients =
    isOpen && businessID && clientsState.businessID === businessID
      ? clientsState.clients
      : [];
  const loading = !!(
    isOpen &&
    businessID &&
    (clientsState.businessID === null || clientsState.businessID !== businessID)
  );

  return { clients, loading };
};
