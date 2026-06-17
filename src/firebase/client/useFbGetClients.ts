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
type ClientsSnapshotState = {
  scopeKey: string | null;
  clients: ClientListItem[];
};

interface UseFbGetClientsOptions {
  enabled?: boolean;
  includeDeleted?: boolean;
  preserveCurrentOnError?: boolean;
}

const buildClientList = (
  docs: Array<{ id: string; data: () => unknown }>,
  includeDeleted: boolean,
): ClientListItem[] =>
  docs.reduce<ClientListItem[]>((acc, docSnap) => {
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

    acc.push({
      id: docSnap.id,
      isDeleted,
      ...extras,
      client,
    });
    return acc;
  }, []);

export const useFbGetClients = ({
  enabled = true,
  includeDeleted = false,
  preserveCurrentOnError = false,
}: UseFbGetClientsOptions = {}) => {
  const [snapshotState, setSnapshotState] = useState<ClientsSnapshotState>({
    scopeKey: null,
    clients: [],
  });
  const user = useSelector(selectUser) as UserWithBusiness | null;
  const businessID = user?.businessID ?? null;
  const scopeKey = enabled && businessID
    ? `${businessID}:${includeDeleted ? 'all' : 'active'}`
    : null;

  useEffect(() => {
    if (!enabled || !businessID || !scopeKey) {
      return undefined;
    }

    const clientRef = collection(db, 'businesses', businessID, 'clients');
    const q = query(clientRef, orderBy('client.name', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        setSnapshotState({ scopeKey, clients: [] });
        return;
      }
      const clientArray = buildClientList(snapshot.docs, includeDeleted);
      setSnapshotState({ scopeKey, clients: clientArray });
    },
    (error) => {
      console.error('Error fetching clients:', error);
      setSnapshotState((prev) =>
        preserveCurrentOnError && prev.scopeKey === scopeKey
          ? prev
          : { scopeKey, clients: [] },
      );
    });

    return () => {
      unsubscribe();
    };
  }, [businessID, enabled, includeDeleted, preserveCurrentOnError, scopeKey]);

  const isCurrentSnapshot = snapshotState.scopeKey === scopeKey;
  const clients = scopeKey && isCurrentSnapshot ? snapshotState.clients : [];
  const loading = Boolean(scopeKey) && !isCurrentSnapshot;

  return { clients, loading };
};
