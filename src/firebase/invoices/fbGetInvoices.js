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
import { validateUser } from '../../utils/userValidation';
import { db } from '../firebaseconfig';

export const fbGetInvoices = (time) => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const user = useSelector(selectUser);

  useEffect(() => {
    const hasValidRange = Boolean(time?.startDate && time?.endDate);
    const hasValidUser = Boolean(user?.businessID);

    if (!hasValidRange || !hasValidUser) {
      setInvoices([]);
      setLoading(false);
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
          if (role === 'admin' || role === 'owner' || role === 'dev') {
            // Si el usuario es admin y la fecha actual es posterior al 21/02/2024
            q = query(
              invoicesRef,
              where('data.date', '>=', start),
              where('data.date', '<=', end),
              orderBy('data.date', 'desc'),
            );
          } else {
            // Si el usuario no es admin y la fecha actual es posterior al 21/02/2024
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
            .map((item) => item.data())
            .filter((item) => item.data.status !== 'cancelled');

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

    setLoading(true);
    const unsubscribe = fetchInvoices();

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [time?.startDate, time?.endDate, user?.businessID, user?.uid, user?.role]);

  return { invoices, loading };
};
