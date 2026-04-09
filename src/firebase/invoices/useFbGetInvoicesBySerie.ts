import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { db } from '@/firebase/firebaseconfig';
import type { InvoiceDoc, InvoiceDocWithId } from './types';

type UserRootState = Parameters<typeof selectUser>[0];

const getSerieBounds = (serie: string | null | undefined) => {
  if (!serie) return null;
  const normalized = serie.toUpperCase();

  const lastChar = normalized.charCodeAt(normalized.length - 1);
  const nextChar = String.fromCharCode(lastChar + 1);
  const upperBound = `${normalized.slice(0, -1)}${nextChar}`;

  return {
    normalized,
    start: normalized,
    end: upperBound,
  };
};

export const useFbGetInvoicesBySerie = (
  serie: string | null | undefined,
  { includeCancelled = false }: { includeCancelled?: boolean } = {},
) => {
  const businessID = useSelector(
    (s: UserRootState) => selectUser(s)?.businessID,
  );

  const bounds = useMemo(() => getSerieBounds(serie), [serie]);

  // Primitives for dependencies
  const boundsNormalized = bounds?.normalized;
  const boundsStart = bounds?.start;
  const boundsEnd = bounds?.end;

  // Outer queryKey for loading derived state
  const queryKey =
    !businessID || !boundsNormalized
      ? ''
      : `${businessID}|${boundsNormalized}|${includeCancelled}`;

  const [state, setState] = useState<{ invoices: InvoiceDocWithId[] }>({
    invoices: [],
  });
  const [resolvedKey, setResolvedKey] = useState('');

  useEffect(() => {
    if (!businessID || !boundsNormalized) return undefined;

    // Local queryKey to match effect cycle
    const queryKeyLocal = `${businessID}|${boundsNormalized}|${includeCancelled}`;

    const invoicesRef = collection(db, 'businesses', businessID, 'invoices');

    const q = query(
      invoicesRef,
      where('data.NCF', '>=', boundsStart),
      where('data.NCF', '<', boundsEnd),
      orderBy('data.NCF', 'asc'),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const rawInvoices: InvoiceDocWithId[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as InvoiceDoc),
        }));

        const filtered = rawInvoices.filter((invoice) => {
          const ncf = invoice?.data?.NCF || invoice?.NCF || '';
          if (!ncf) return false;
          // Validación extra aunque la query ya filtra por rango
          if (!ncf.toUpperCase().startsWith(boundsNormalized)) return false;
          if (!includeCancelled && invoice?.data?.status === 'cancelled')
            return false;
          return true;
        });

        setState({ invoices: filtered });
        setResolvedKey(queryKeyLocal);
      },
      (error) => {
        console.error('Error listening invoices by serie:', error);
        setState({ invoices: [] });
        setResolvedKey(queryKeyLocal);
      },
    );
  }, [businessID, boundsStart, boundsEnd, boundsNormalized, includeCancelled]);

  const isResolved = queryKey && resolvedKey === queryKey;

  return {
    invoices: isResolved ? state.invoices : [],
    loading: Boolean(queryKey && !isResolved),
    error: null,
  };
};
