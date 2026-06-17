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
import type {
  DebitNoteFilters,
  DebitNoteRecord,
} from '@/modules/invoice/types/debitNote';
import type { UserIdentity } from '@/types/users';
import type { TimestampLike } from '@/utils/date/types';

type DateLikeObject = {
  toJSDate?: () => Date;
  toDate?: () => Date;
  toMillis?: () => number;
  seconds?: number;
  nanoseconds?: number;
};

type DateLike = TimestampLike | DateLikeObject;

const toDate = (value: DateLike): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    return new Date(value);
  }
  if (value && typeof value === 'object') {
    const maybe = value as DateLikeObject;
    if (typeof maybe.toJSDate === 'function') return maybe.toJSDate();
    if (typeof maybe.toDate === 'function') return maybe.toDate();
    if (typeof maybe.toMillis === 'function') return new Date(maybe.toMillis());
    if (typeof maybe.seconds === 'number') {
      return new Date(maybe.seconds * 1000);
    }
  }
  return new Date(0);
};

const getTimestampKey = (value: DateLike): string => {
  if (!value) return '';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? String(value)
      : parsed.toISOString();
  }
  if (value && typeof value === 'object') {
    const maybe = value as DateLikeObject;
    if (typeof maybe.toJSDate === 'function')
      return maybe.toJSDate().toISOString();
    if (typeof maybe.toDate === 'function') return maybe.toDate().toISOString();
    if (typeof maybe.toMillis === 'function') return String(maybe.toMillis());
    if (typeof maybe.seconds === 'number') {
      return String(maybe.seconds);
    }
  }
  return '';
};

export const useFbGetDebitNotes = (filters: DebitNoteFilters = {}) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [debitNotes, setDebitNotes] = useState<DebitNoteRecord[]>([]);
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

    const debitNotesRef = collection(
      db,
      'businesses',
      businessID,
      'debitNotes',
    );
    const queryConstraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

    if (filters.startDate && filters.endDate) {
      queryConstraints.push(
        where('createdAt', '>=', Timestamp.fromDate(toDate(filters.startDate))),
        where('createdAt', '<=', Timestamp.fromDate(toDate(filters.endDate))),
      );
    }

    if (filters.clientId) {
      queryConstraints.push(where('client.id', '==', filters.clientId));
    }

    if (filters.status) {
      queryConstraints.push(where('status', '==', filters.status));
    }

    const unsubscribe = onSnapshot(
      query(debitNotesRef, ...queryConstraints),
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          ...(doc.data() as DebitNoteRecord),
          id: doc.id,
        }));
        setDebitNotes(list);
        setResolvedQueryKey(queryKey);
      },
      (error) => {
        console.error('Error fetching debit notes:', error);
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
  const visibleDebitNotes = businessID ? debitNotes : [];

  return { debitNotes: visibleDebitNotes, loading };
};
