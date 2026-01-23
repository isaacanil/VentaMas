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
  client: NormalizedClient;
} & Record<string, unknown>;

type ClientsState = {
  businessID: string | null;
  clients: ClientListItem[];
};

export const useFbGetClientsOnOpen = ({ isOpen }: { isOpen: boolean }) => {
  const user = useSelector(selectUser) as UserWithBusiness | null;
  const businessID = user?.businessID ?? null;

  const [clientsState, setClientsState] = useState<ClientsState>(() => ({
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
        const list = snap.docs.reduce<ClientListItem[]>((acc, doc) => {
          const data = (doc.data() || {}) as ClientDocumentData;
          if (data.isDeleted) return acc;

          const client = extractNormalizedClient(data);
          const extras: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(data)) {
            if (key === 'client') continue;
            if (!CLIENT_ROOT_FIELDS.has(key)) {
              extras[key] = value;
            }
          }

          const item: ClientListItem = {
            id: doc.id,
            ...extras,
            client,
          };

          acc.push(item);
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
