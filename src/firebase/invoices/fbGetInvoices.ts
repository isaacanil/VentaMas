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
import { db } from '../firebaseconfig';
import type { InvoiceDoc } from './types';

type UserRootState = Parameters<typeof selectUser>[0];

type TimeRange = {
  startDate?: string | number | Date;
  endDate?: string | number | Date;
};

export const useFbGetInvoices = (time: TimeRange | null | undefined) => {
  const [loading, setLoading] = useState(() =>
    Boolean(time?.startDate && time?.endDate),
  );
  const [invoices, setInvoices] = useState<InvoiceDoc[]>([]);
  const user = useSelector((state: UserRootState) => selectUser(state));

  if (
    (!time?.startDate || !time?.endDate || !user?.businessID) &&
    (invoices.length > 0 || loading)
  ) {
    if (invoices.length > 0) setInvoices([]);
    if (loading) setLoading(false);
  }

  useEffect(() => {
    const hasValidRange = Boolean(time?.startDate && time?.endDate);
    const hasValidUser = Boolean(user?.businessID);

    if (!hasValidRange || !hasValidUser) {
      return undefined;
    }

    const fetchInvoices = () => {
      try {
        validateUser(user);
        const { businessID, uid, role } = user;

        const start = new Date(time.startDate);
        const end = new Date(time.endDate);
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
            setInvoices([]);
            setLoading(false);
            return;
          }
          const data = snapshot.docs
            .map((item) => item.data() as InvoiceDoc)
            .filter((item) => item?.data?.status !== 'cancelled');

          setInvoices(data);
          setLoading(false);
        });

        return unsubscribe;
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setInvoices([]);
        setLoading(false);
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
    time?.startDate,
    time?.endDate,
    user?.businessID,
    user?.uid,
    user?.role,
    user,
  ]);

  return { invoices, loading };
};
