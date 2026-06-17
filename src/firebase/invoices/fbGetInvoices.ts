import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { hasManageAllAccess } from '../../utils/access/manageAllAccess';
import { validateUser } from '../../utils/userValidation';
import { db } from '@/firebase/firebaseconfig';
import type { InvoiceDoc } from './types';

type UserRootState = Parameters<typeof selectUser>[0];

type TimeRange = {
  startDate?: string | number | Date;
  endDate?: string | number | Date;
};

type InvoicesSnapshotState = {
  queryKey: string | null;
  invoices: InvoiceDoc[];
};

export const useFbGetInvoices = (time: TimeRange | null | undefined) => {
  const user = useSelector((state: UserRootState) => selectUser(state));
  const [snapshotState, setSnapshotState] = useState<InvoicesSnapshotState>({
    queryKey: null,
    invoices: [],
  });

  const businessID = user?.businessID ?? null;
  const uid = user?.uid ?? null;
  const role = user?.role ?? null;
  const startDate = time?.startDate ?? null;
  const endDate = time?.endDate ?? null;
  const queryKey =
    businessID && startDate && endDate
      ? `${businessID}|${uid ?? ''}|${role ?? ''}|${String(startDate)}|${String(endDate)}`
      : null;

  useEffect(() => {
    if (!user || !businessID || !startDate || !endDate || !queryKey) {
      return undefined;
    }

    const fetchInvoices = () => {
      try {
        validateUser(user);
        const { businessID, uid, role } = user;

        const start = new Date(startDate);
        const end = new Date(endDate);
        const restrictionStartDate = new Date('2024-01-21T14:41:00');

        const invoicesRef = collection(
          db,
          'businesses',
          businessID,
          'invoices',
        );

        let q;
        if (new Date() >= restrictionStartDate) {
          // Comprobación de la fecha para aplicar la restricción
          if (hasManageAllAccess({ role })) {
            // Si el usuario es admin y la fecha actual es posterior al 21/02/2024
            q = query(
              invoicesRef,
              where('data.date', '>=', start),
              where('data.date', '<=', end),
              orderBy('data.date', 'desc'),
            );
          } else {
            // Si el usuario no es privilegiado y la fecha actual es posterior al 21/02/2024
            q = query(
              invoicesRef,
              where('data.date', '>=', start),
              where('data.date', '<=', end),
              where('data.userID', '==', uid),
              orderBy('data.date', 'desc'),
            );
          }
        } else {
          // Si la fecha actual es anterior al 21/02/2024, aplicar lógica anterior (sin restricciones basadas en el rol)
          q = query(
            invoicesRef,
            where('data.date', '>=', start),
            where('data.date', '<=', end),
            orderBy('data.date', 'desc'),
          );
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
          if (snapshot.empty) {
            setSnapshotState({ queryKey, invoices: [] });
            return;
          }
          const data = snapshot.docs
            .map((item) => item.data() as InvoiceDoc)
            .filter((item) => item?.data?.status !== 'cancelled');

          setSnapshotState({ queryKey, invoices: data });
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setSnapshotState({ queryKey, invoices: [] });
        return undefined;
      }
    };

    const unsubscribe = fetchInvoices();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [
    businessID,
    startDate,
    endDate,
    queryKey,
    uid,
    role,
    user,
  ]);

  const isCurrentSnapshot = snapshotState.queryKey === queryKey;
  const invoices = queryKey && isCurrentSnapshot ? snapshotState.invoices : [];
  const loading = Boolean(queryKey) && !isCurrentSnapshot;

  return { invoices, loading };
};
