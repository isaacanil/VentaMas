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
import { getInvoicePaymentInfo } from '../../utils/invoice';
import { validateUser } from '../../utils/userValidation';
import { db } from '../firebaseconfig';

// Función para aplicar filtros del lado del cliente
const applyClientSideFilters = (invoices, filters) => {
  return invoices.filter((invoice) => {
    const invoiceData = invoice.data;

    if (filters.receivablesOnly) {
      const isReceivableInvoice =
        invoiceData?.isAddedToReceivables === true ||
        Boolean(invoiceData?.accountsReceivable) ||
        invoiceData?.snapshot?.cart?.isAddedToReceivables === true;
      if (!isReceivableInvoice) return false;
    }

    // Filtro por método de pago
    if (filters.paymentMethod) {
      const hasPaymentMethod = invoiceData.paymentMethod?.some(
        (method) =>
          method.method === filters.paymentMethod && method.status === true,
      );
      if (!hasPaymentMethod) return false;
    }

    // Filtro por monto mínimo
    if (filters.minAmount !== null && filters.minAmount !== undefined) {
      const totalAmount = invoiceData.totalPurchase?.value || 0;
      if (totalAmount < filters.minAmount) return false;
    }

    // Filtro por monto máximo
    if (filters.maxAmount !== null && filters.maxAmount !== undefined) {
      const totalAmount = invoiceData.totalPurchase?.value || 0;
      if (totalAmount > filters.maxAmount) return false;
    }

    if (filters.paymentStatus) {
      const { paid, total, isPaidInFull } = getInvoicePaymentInfo(invoiceData);
      const hasPayment = paid > 0;
      const hasPending = total > paid;

      if (filters.paymentStatus === 'paid' && !isPaidInFull) return false;
      if (filters.paymentStatus === 'partial' && !(hasPayment && hasPending))
        return false;
      if (filters.paymentStatus === 'unpaid' && hasPayment) return false;
    }

    return true;
  });
};

export const useFbGetInvoicesWithFilters = (filters = {}) => {
  const user = useSelector(selectUser);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  if (!user?.businessID) {
    if (invoices.length > 0) setInvoices([]);
    if (loading) setLoading(false);
  }

  // Detect changes in filter prerequisites to reset state during render
  const queryKey = `${user?.businessID}-${JSON.stringify(filters)}`;
  const [prevQueryKey, setPrevQueryKey] = useState(queryKey);

  if (queryKey !== prevQueryKey) {
    setPrevQueryKey(queryKey);
    setLoading(true);
  }

  useEffect(() => {
    if (!user?.businessID) {
      return undefined;
    }

    // Loading is set to true via the render-phase state update above


    const fetchInvoices = () => {
      try {
        validateUser(user);
        const { businessID, uid, role } = user;

        // Convertir filtros de fecha
        const start = filters.startDate ? new Date(filters.startDate) : null;
        const end = filters.endDate ? new Date(filters.endDate) : null;
        const restrictionStartDate = new Date('2024-01-21T14:41:00');

        const invoicesRef = collection(
          db,
          'businesses',
          businessID,
          'invoices',
        );

        // Construir la consulta con filtros dinámicos
        let queryConstraints = [];

        // Filtros de fecha (requeridos para evitar consultas muy amplias)
        if (start && end) {
          queryConstraints.push(
            where('data.date', '>=', start),
            where('data.date', '<=', end),
          );
        } else {
          // Si no hay fechas, usar un rango por defecto (hoy)
          const today = new Date();
          const startOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
          );
          const endOfDay = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate(),
            23,
            59,
            59,
          );

          queryConstraints.push(
            where('data.date', '>=', startOfDay),
            where('data.date', '<=', endOfDay),
          );
        }

        // Filtro por cliente (opcional)
        if (filters.clientId) {
          queryConstraints.push(
            where('data.client.id', '==', filters.clientId),
          );
        }

        // Restricciones de rol (igual que en fbGetInvoices)
        if (new Date() >= restrictionStartDate) {
          if (role !== 'admin' && role !== 'owner' && role !== 'dev') {
            queryConstraints.push(where('data.userID', '==', uid));
          }
        }

        // Ordenamiento
        queryConstraints.push(orderBy('data.date', 'desc'));

        const q = query(invoicesRef, ...queryConstraints);

        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            if (snapshot.empty) {
              setInvoices([]);
              setLoading(false);
              return;
            }

            let data = snapshot.docs
              .map((item) => item.data())
              .filter((item) => item.data.status !== 'cancelled');

            // Aplicar filtros del lado del cliente
            data = applyClientSideFilters(data, filters);

            setInvoices(data);
            setLoading(false);
          },
          (error) => {
            console.error('Error fetching invoices with filters:', error);
            setLoading(false);
          },
        );

        return unsubscribe;
      } catch (error) {
        console.error('Error setting up invoices listener:', error);
        setLoading(false);
        return undefined;
      }
    };

    const unsubscribe = fetchInvoices();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [
    user?.businessID,
    filters.startDate,
    filters.endDate,
    filters.clientId,
    filters.paymentMethod,
    filters.paymentStatus,
    filters.minAmount,
    filters.maxAmount,
    filters.receivablesOnly,
    user?.uid,
    user?.role,
    filters,
    user,
  ]);

  return { invoices, loading };
};
