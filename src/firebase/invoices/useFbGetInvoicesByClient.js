import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../firebaseconfig';

const toMs = (v) => {
  if (v == null) return null;
  if (typeof v?.toMillis === 'function') return v.toMillis(); // Firestore Timestamp
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v === 'string') {
    const ms = Date.parse(v);
    return Number.isNaN(ms) ? null : ms;
  }
  return null;
};

export const useFbGetInvoicesByClient = (clientId, dateRange = null) => {
  const businessID = useSelector((s) => selectUser(s)?.businessID);

  const startMs = toMs(dateRange?.[0]);
  const endMs = toMs(dateRange?.[1]);

  // Construimos queryKey actual fuera del efecto para determinar loading
  const queryKey = (!businessID || !clientId)
    ? ''
    : `${businessID}|${clientId}|${startMs ?? ''}|${endMs ?? ''}`;

  const [invoicesState, setInvoicesState] = useState([]);
  const [resolvedKey, setResolvedKey] = useState(''); // último snapshot aplicado

  useEffect(() => {
    if (!businessID || !clientId) return undefined;

    // Calculamos queryKeyLocal dentro para asegurar coincidencia con el ciclo actual del efecto
    const queryKeyLocal = `${businessID}|${clientId}|${startMs ?? ''}|${endMs ?? ''}`;

    const invoicesRef = collection(db, 'businesses', businessID, 'invoices');

    const constraints = [where('data.client.id', '==', clientId)];

    if (startMs != null && endMs != null) {
      constraints.push(where('data.date', '>=', new Date(startMs)));
      constraints.push(where('data.date', '<=', new Date(endMs)));
    }

    constraints.push(orderBy('data.date', 'desc'));

    const q = query(invoicesRef, ...constraints);

    return onSnapshot(
      q,
      (snapshot) => {
        const invoicesData = snapshot.empty
          ? []
          : snapshot.docs.map((doc) => doc.data().data);

        setInvoicesState(invoicesData);
        setResolvedKey(queryKeyLocal);
      },
      (error) => {
        console.error('Error fetching invoices by client:', error);
        setInvoicesState([]);
        setResolvedKey(queryKeyLocal);
      },
    );
  }, [businessID, clientId, startMs, endMs]);

  const isResolved = queryKey && resolvedKey === queryKey;

  return {
    invoices: isResolved ? invoicesState : [],
    loading: Boolean(queryKey && !isResolved),
  };
};
