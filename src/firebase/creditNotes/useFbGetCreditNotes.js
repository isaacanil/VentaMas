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

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

export const useFbGetCreditNotes = (filters = {}) => {
  const user = useSelector(selectUser);
  const [creditNotes, setCreditNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.businessID) {
      setCreditNotes([]);
      return;
    }

    setLoading(true);

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
      const startTimestamp = Timestamp.fromDate(filters.startDate.toDate());
      const endTimestamp = Timestamp.fromDate(filters.endDate.toDate());

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
