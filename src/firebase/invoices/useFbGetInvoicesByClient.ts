import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/dateUtils';
import type { InvoiceData } from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';

type UserRootState = Parameters<typeof selectUser>[0];

const toMs = (value: TimestampLike): number | null => {
  const millis = toMillis(value);
  return typeof millis === 'number' && Number.isFinite(millis) ? millis : null;
};

type DateRange = [TimestampLike, TimestampLike] | null;

export const useFbGetInvoicesByClient = (
  clientId: string | null | undefined,
  dateRange: DateRange = null,
) => {
  const businessID = useSelector((s: UserRootState) => selectUser(s)?.businessID);

  const startMs = toMs(dateRange?.[0]);
  const endMs = toMs(dateRange?.[1]);

  // Construimos queryKey actual fuera del efecto para determinar loading
  const queryKey = (!businessID || !clientId)
    ? ''
    : `${businessID}|${clientId}|${startMs ?? ''}|${endMs ?? ''}`;

  const [invoicesState, setInvoicesState] = useState<InvoiceData[]>([]);
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
          : snapshot.docs
              .map((doc) => doc.data())
              .map((docData) => docData?.data)
              .filter(Boolean) as InvoiceData[];

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
