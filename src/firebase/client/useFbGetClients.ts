import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

import {
  CLIENT_ROOT_FIELDS,
  extractNormalizedClient,
} from './clientNormalizer';
import type { ClientDocumentData, NormalizedClient } from './clientNormalizer';

type UserWithBusiness = {
  businessID: string;
};

type ClientListItem = {
  id: string;
  isDeleted: boolean;
  client: NormalizedClient;
} & Record<string, unknown>;

export const useFbGetClients = ({ includeDeleted = false } = {}) => {
  const [clients, setClients] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useSelector(selectUser) as UserWithBusiness | null;
  if ((!user || !user.businessID) && loading) {
    setLoading(false);
  }

  useEffect(() => {
    if (!user || !user.businessID) {
      return undefined;
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
      const clientArray = snapshot.docs.reduce<ClientListItem[]>(
        (acc, docSnap) => {
          const data = (docSnap.data() || {}) as ClientDocumentData;
        const isDeleted = Boolean(data.isDeleted);
        if (!includeDeleted && isDeleted) return acc;

        const client = extractNormalizedClient(data);
        const extras: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
          if (key === 'client') continue;
          if (!CLIENT_ROOT_FIELDS.has(key)) {
            extras[key] = value;
          }
        }

        const item: ClientListItem = {
          id: docSnap.id,
          isDeleted,
          ...extras,
          client,
        };

        acc.push(item);
        return acc;
      },
      [],
    );

      setClients(clientArray);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user, includeDeleted]);

  return { clients, loading };
};
