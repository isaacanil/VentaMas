import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
  type QueryConstraint,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { CreditNoteFilters, CreditNoteRecord } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';
import type { TimestampLike } from '@/utils/date/types';

type DateLike = TimestampLike | { toJSDate?: () => Date };

const toDate = (value: DateLike): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  if (value && typeof value === 'object') {
    if (typeof value.toJSDate === 'function') return value.toJSDate();
    if (typeof value.toDate === 'function') return value.toDate();
    if (typeof value.toMillis === 'function') return new Date(value.toMillis());
    if ('seconds' in value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }
  }
  return new Date(0);
};

const getTimestampKey = (value: DateLike): string => {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? String(value) : parsed.toISOString();
  }
  if (value && typeof value === 'object') {
    if (typeof value.toJSDate === 'function') return value.toJSDate().toISOString();
    if (typeof value.toDate === 'function') return value.toDate().toISOString();
    if (typeof value.toMillis === 'function') return String(value.toMillis());
    if ('seconds' in value && typeof value.seconds === 'number') {
      return String(value.seconds);
    }
  }
  return '';
};

export const useFbGetCreditNotes = (filters: CreditNoteFilters = {}) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [creditNotes, setCreditNotes] = useState<CreditNoteRecord[]>([]);
  const [resolvedQueryKey, setResolvedQueryKey] = useState<string | null>(null);

  const businessID = user?.businessID ?? null;
  const queryKey = useMemo(
    () =>
      [
        businessID ?? 'no-business',
        getTimestampKey(filters.startDate),
        getTimestampKey(filters.endDate),
        String(filters.clientId ?? ''),
        String(filters.status ?? ''),
      ].join('|'),
    [
      businessID,
      filters.startDate,
      filters.endDate,
      filters.clientId,
      filters.status,
    ],
  );

  useEffect(() => {
    if (!businessID) {
      return undefined;
    }

    const creditNotesRef = collection<CreditNoteRecord>(
      db,
      'businesses',
      businessID,
      'creditNotes',
    );

    // Construir la consulta con filtros dinámicos
    const queryConstraints: QueryConstraint[] = [
      orderBy('createdAt', 'desc'),
    ];

    // Filtro por rango de fechas
    if (filters.startDate && filters.endDate) {
      const startTimestamp = Timestamp.fromDate(toDate(filters.startDate));
      const endTimestamp = Timestamp.fromDate(toDate(filters.endDate));

      queryConstraints.push(
        where('createdAt', '>=', startTimestamp),
        where('createdAt', '<=', endTimestamp),
      );
    }

    // Filtro por cliente
    if (filters.clientId) {
      queryConstraints.push(where('client.id', '==', filters.clientId));
    }

    // Filtro por estado
    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }

    const q = query(creditNotesRef, ...queryConstraints);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id, // Asegurar que el ID esté incluido
        }));
        setCreditNotes(list);
        setResolvedQueryKey(queryKey);
      },
      (error) => {
        console.error('Error fetching credit notes:', error);
        setResolvedQueryKey(queryKey);
      },
    );

    return () => unsubscribe();
  }, [
    businessID,
    filters.startDate,
    filters.endDate,
    filters.clientId,
    filters.status,
    queryKey,
  ]);

  const loading = Boolean(businessID) && queryKey !== resolvedQueryKey;
  const visibleCreditNotes = businessID ? creditNotes : [];

  return { creditNotes: visibleCreditNotes, loading };
};
