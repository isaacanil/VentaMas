// @ts-nocheck
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';

export const useFbGetCreditNotes = (filters = {}) => {
  const user = useSelector(selectUser);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const deps = [
    user?.businessID,
    filters?.startDate,
    filters?.endDate,
    filters?.clientId,
    filters?.status,
  ];
  const [prevDeps, setPrevDeps] = useState(deps);

  if (!user?.businessID) {
    if (creditNotes.length > 0) setCreditNotes([]);
    if (loading) setLoading(false);
  } else {
    const depsChanged = deps.some((d, i) => d !== prevDeps[i]);
    if (depsChanged) {
      setPrevDeps(deps);
      setLoading(true);
    }
  }

  useEffect(() => {
    if (!user?.businessID) {
      return undefined;
    }

    const creditNotesRef = collection(
      db,
      'businesses',
      user.businessID,
      'creditNotes',
    );

    // Construir la consulta con filtros dinámicos
    let queryConstraints = [orderBy('createdAt', 'desc')];

    // Filtro por rango de fechas
    if (filters.startDate && filters.endDate) {
      const toDate = (value) => {
        if (value instanceof Date) return value;
        if (typeof value?.toJSDate === 'function') return value.toJSDate();
        if (typeof value?.toDate === 'function') return value.toDate();
        return new Date(value);
      };
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
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching credit notes:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [
    user?.businessID,
    filters.startDate,
    filters.endDate,
    filters.clientId,
    filters.status,
  ]);

  return { creditNotes, loading };
};
