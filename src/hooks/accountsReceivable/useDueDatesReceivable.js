import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  documentId,
  orderBy,
  getCountFromServer,
  getAggregateFromServer,
  sum,
  average,
  count,
} from 'firebase/firestore';
import { DateTime } from 'luxon';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import { db } from '../../firebase/firebaseconfig';

/**
 * Hook personalizado para obtener cuentas por cobrar próximas a vencer
 * Optimizado con funciones recientes de Firebase Firestore v10+
 * Incluye agregaciones, consultas compuestas y cache inteligente
 * @param {number} daysThreshold - Días de anticipación para considerar "próximo a vencer" (default: 7)
 * @returns {Object} { dueSoonAccounts, overdueAccounts, loading, error, stats }
 */
export const useDueDatesReceivable = (daysThreshold = 7) => {
  const [dueSoonAccounts, setDueSoonAccounts] = useState([]);
  const [overdueAccounts, setOverdueAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalDueSoon: 0,
    totalOverdue: 0,
    totalAlerts: 0,
    totalAmountDueSoon: 0,
    totalAmountOverdue: 0,
    averageAmount: 0,
    totalAccounts: 0,
  });

  const user = useSelector(selectUser);

  // Memoizar fechas para evitar recálculos innecesarios
  const dateThresholds = useMemo(() => {
    const now = DateTime.now().startOf('day');
    const futureLimit = now.plus({ days: daysThreshold }).endOf('day');
    return { now, futureLimit };
  }, [daysThreshold]);

  // Cache para datos relacionados - usar useRef para evitar problemas de dependencias
  const dataCacheRef = useRef({
    clients: new Map(),
    invoices: new Map(),
    accounts: new Map(),
    lastUpdated: null,
  });

  // Función para limpiar cache cada 5 minutos
  const cleanCache = useCallback(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (!dataCacheRef.current.lastUpdated || dataCacheRef.current.lastUpdated < fiveMinutesAgo) {
      dataCacheRef.current = {
        clients: new Map(),
        invoices: new Map(),
        accounts: new Map(),
        lastUpdated: Date.now(),
      };
    }
  }, []);

  // Función optimizada para obtener datos de clientes en lote
  const fetchClientsInBatch = useCallback(
    async (clientIds) => {
      const dataCache = dataCacheRef.current;
      const uncachedClientIds = clientIds.filter(
        (id) => !dataCache.clients.has(id),
      );

      if (uncachedClientIds.length === 0) return;

      try {
        // Usar documentId() para consulta eficiente de múltiples documentos
        const clientsRef = collection(
          db,
          'businesses',
          user.businessID,
          'clients',
        );
        const clientsQuery = query(
          clientsRef,
          where(documentId(), 'in', uncachedClientIds.slice(0, 10)), // Firestore limita a 10 por consulta 'in'
        );

        const clientsSnap = await getDocs(clientsQuery);

        clientsSnap.forEach((doc) => {
          const clientData = doc.data();
          dataCache.clients.set(doc.id, clientData.client || clientData);
        });

        // Si hay más de 10 clientes, hacer consultas adicionales
        if (uncachedClientIds.length > 10) {
          const remainingIds = uncachedClientIds.slice(10);
          const batches = [];
          for (let i = 0; i < remainingIds.length; i += 10) {
            batches.push(remainingIds.slice(i, i + 10));
          }

          const batchPromises = batches.map((batch) => {
            const batchQuery = query(
              clientsRef,
              where(documentId(), 'in', batch),
            );
            return getDocs(batchQuery);
          });

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach((snapshot) => {
            snapshot.forEach((doc) => {
              const clientData = doc.data();
              dataCache.clients.set(doc.id, clientData.client || clientData);
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching clients in batch:', error);
      }
    },
    [user],
  );

  // Función optimizada para obtener datos de facturas en lote
  const fetchInvoicesInBatch = useCallback(
    async (invoiceIds) => {
      const dataCache = dataCacheRef.current;
      const uncachedInvoiceIds = invoiceIds.filter(
        (id) => !dataCache.invoices.has(id),
      );

      if (uncachedInvoiceIds.length === 0) return;

      try {
        const invoicesRef = collection(
          db,
          'businesses',
          user.businessID,
          'invoices',
        );
        const invoicesQuery = query(
          invoicesRef,
          where(documentId(), 'in', uncachedInvoiceIds.slice(0, 10)),
        );

        const invoicesSnap = await getDocs(invoicesQuery);

        invoicesSnap.forEach((doc) => {
          const invoiceData = doc.data();
          dataCache.invoices.set(doc.id, invoiceData.data || invoiceData);
        });

        // Manejar lotes adicionales si hay más de 10 facturas
        if (uncachedInvoiceIds.length > 10) {
          const remainingIds = uncachedInvoiceIds.slice(10);
          const batches = [];
          for (let i = 0; i < remainingIds.length; i += 10) {
            batches.push(remainingIds.slice(i, i + 10));
          }

          const batchPromises = batches.map((batch) => {
            const batchQuery = query(
              invoicesRef,
              where(documentId(), 'in', batch),
            );
            return getDocs(batchQuery);
          });

          const batchResults = await Promise.all(batchPromises);
          batchResults.forEach((snapshot) => {
            snapshot.forEach((doc) => {
              const invoiceData = doc.data();
              dataCache.invoices.set(doc.id, invoiceData.data || invoiceData);
            });
          });
        }
      } catch (error) {
        console.warn('Error fetching invoices in batch:', error);
      }
    },
    [user],
  );

  useEffect(() => {
    if (!user?.businessID) {
      return;
    }


    // Limpiar cache periódicamente
    cleanCache();

    const { now, futureLimit } = dateThresholds;

    // Query optimizada con índices compuestos y ordenación
    const installmentsRef = collection(
      db,
      'businesses',
      user.businessID,
      'accountsReceivableInstallments',
    );
    const installmentsQuery = query(
      installmentsRef,
      where('installmentDate', '<=', futureLimit.toJSDate()),
      where('isActive', '==', true), // Solo cuotas activas
      orderBy('installmentDate', 'asc'), // Ordenar por fecha para mejor rendimiento
    );

    // Consulta separada para estadísticas usando agregaciones
    const getAggregatedStats = async () => {
      try {
        // Consulta de agregación para cuentas vencidas
        const overdueQuery = query(
          installmentsRef,
          where('installmentDate', '<', now.toJSDate()),
          where('isActive', '==', true),
        );

        // Consulta de agregación para cuentas próximas a vencer
        const dueSoonQuery = query(
          installmentsRef,
          where('installmentDate', '>=', now.toJSDate()),
          where('installmentDate', '<=', futureLimit.toJSDate()),
          where('isActive', '==', true),
        );

        // Usar getCountFromServer para obtener conteos eficientemente
        const [overdueCount, dueSoonCount] = await Promise.all([
          getCountFromServer(overdueQuery),
          getCountFromServer(dueSoonQuery),
        ]);

        // Consulta de agregación para montos (usando getAggregateFromServer)
        const installmentsForAmounts = query(
          installmentsRef,
          where('installmentDate', '<=', futureLimit.toJSDate()),
          where('isActive', '==', true),
        );

        const aggregateSnapshot = await getAggregateFromServer(
          installmentsForAmounts,
          {
            totalAmount: sum('installmentBalance'),
            averageAmount: average('installmentBalance'),
            totalCount: count(),
          },
        );

        const aggregateData = aggregateSnapshot.data();

        return {
          overdueCount: overdueCount.data().count,
          dueSoonCount: dueSoonCount.data().count,
          totalAmount: aggregateData.totalAmount || 0,
          averageAmount: aggregateData.averageAmount || 0,
          totalCount: aggregateData.totalCount || 0,
        };
      } catch (error) {
        console.warn('Error getting aggregated stats:', error);
        return null;
      }
    };

    const unsubscribe = onSnapshot(
      installmentsQuery,
      async (querySnapshot) => {
        const dataCache = dataCacheRef.current;
        setError(null);
        try {
          if (querySnapshot.empty) {
            setDueSoonAccounts([]);
            setOverdueAccounts([]);
            setStats({
              totalDueSoon: 0,
              totalOverdue: 0,
              totalAlerts: 0,
              totalAmountDueSoon: 0,
              totalAmountOverdue: 0,
              averageAmount: 0,
              totalAccounts: 0,
            });
            setLoading(false);
            return;
          }

          // Obtener estadísticas agregadas en paralelo
          const aggregatedStatsPromise = getAggregatedStats();

          const accountsMap = new Map();
          const clientIds = new Set();
          const invoiceIds = new Set();
          const arIds = new Set();

          // Primera pasada: recopilar IDs únicos
          querySnapshot.forEach((docSnap) => {
            const installment = docSnap.data();
            arIds.add(installment.arId);
          });

          // Obtener datos de cuentas por cobrar en lote
          const arRef = collection(
            db,
            'businesses',
            user.businessID,
            'accountsReceivable',
          );
          const arIdsArray = Array.from(arIds);
          const arBatches = [];

          for (let i = 0; i < arIdsArray.length; i += 10) {
            arBatches.push(arIdsArray.slice(i, i + 10));
          }

          const arPromises = arBatches.map((batch) => {
            const arQuery = query(arRef, where(documentId(), 'in', batch));
            return getDocs(arQuery);
          });

          const arResults = await Promise.all(arPromises);

          // Procesar datos de AR y recopilar IDs de clientes e facturas
          arResults.forEach((snapshot) => {
            snapshot.forEach((doc) => {
              const arData = doc.data();
              if (arData.isActive) {
                dataCache.accounts.set(doc.id, arData);
                clientIds.add(arData.clientId);
                invoiceIds.add(arData.invoiceId);
              }
            });
          });

          // Obtener datos de clientes e facturas en paralelo
          await Promise.all([
            fetchClientsInBatch(Array.from(clientIds)),
            fetchInvoicesInBatch(Array.from(invoiceIds)),
          ]);

          // Segunda pasada: procesar cuotas con datos completos
          querySnapshot.forEach((docSnap) => {
            const installment = docSnap.data();
            const installmentDate = DateTime.fromJSDate(
              installment.installmentDate.toDate(),
            );
            const daysUntilDue = installmentDate.diff(now, 'days').days;

            const arData = dataCache.accounts.get(installment.arId);
            if (!arData || !arData.isActive) return;

            const clientData = dataCache.clients.get(arData.clientId);
            const invoiceData = dataCache.invoices.get(arData.invoiceId);

            // Agrupar por cuenta
            if (!accountsMap.has(installment.arId)) {
              accountsMap.set(installment.arId, {
                id: installment.arId,
                invoiceId: arData.invoiceId,
                invoiceNumber: invoiceData?.numberID || arData.invoiceId,
                clientId: arData.clientId,
                clientName: clientData?.name || 'Cliente desconocido',
                clientPhone: clientData?.tel || clientData?.phone || '',
                totalReceivable: arData.totalReceivable,
                arBalance: arData.arBalance,
                createdAt: arData.createdAt,
                installments: [],
                nextDueDate: null,
                daysUntilNextDue: null,
                isOverdue: false,
                numberId: arData.numberId,
                paymentFrequency: arData.paymentFrequency,
                totalInstallments: arData.totalInstallments,
                type: arData.type || 'normal',
                insurance: arData.insurance || null,
                invoiceDate: invoiceData?.date,
                invoiceTotal: invoiceData?.totalAmount,
                invoiceStatus: invoiceData?.status,
                pendingInstallments: 0,
                paidInstallments: 0,
              });
            }

            const account = accountsMap.get(installment.arId);
            account.installments.push({
              id: installment.id,
              installmentNumber: installment.installmentNumber,
              installmentAmount: installment.installmentAmount,
              installmentBalance: installment.installmentBalance,
              installmentDate: installmentDate,
              daysUntilDue: Math.ceil(daysUntilDue),
              isOverdue: daysUntilDue < 0,
              isActive: installment.isActive,
            });

            // Actualizar la fecha de vencimiento más próxima
            if (
              installment.isActive &&
              (!account.nextDueDate || installmentDate < account.nextDueDate)
            ) {
              account.nextDueDate = installmentDate;
              account.daysUntilNextDue = Math.ceil(daysUntilDue);
              account.isOverdue = daysUntilDue < 0;
            }
          });

          // Obtener conteo completo de cuotas para cada cuenta usando una sola consulta
          const allInstallmentsPromises = Array.from(accountsMap.keys()).map(
            async (arId) => {
              try {
                const allInstallmentsQuery = query(
                  collection(
                    db,
                    'businesses',
                    user.businessID,
                    'accountsReceivableInstallments',
                  ),
                  where('arId', '==', arId),
                );

                // Usar agregación para obtener conteos eficientemente
                const activeCountQuery = query(
                  allInstallmentsQuery,
                  where('isActive', '==', true),
                );
                const inactiveCountQuery = query(
                  allInstallmentsQuery,
                  where('isActive', '==', false),
                );

                const [activeCount, inactiveCount] = await Promise.all([
                  getCountFromServer(activeCountQuery),
                  getCountFromServer(inactiveCountQuery),
                ]);

                const account = accountsMap.get(arId);
                if (account) {
                  account.pendingInstallments = activeCount.data().count;
                  account.paidInstallments = inactiveCount.data().count;
                  account.totalInstallments =
                    account.pendingInstallments + account.paidInstallments;
                }
              } catch (error) {
                console.warn(
                  `Error fetching installment counts for AR ${arId}:`,
                  error,
                );
              }
            },
          );

          await Promise.all(allInstallmentsPromises);

          // Convertir Map a Array y separar por estado
          const allAccounts = Array.from(accountsMap.values());

          // Ordenar cuotas por fecha para cada cuenta
          allAccounts.forEach((account) => {
            account.installments.sort(
              (a, b) => a.installmentDate - b.installmentDate,
            );
          });

          const dueSoon = allAccounts.filter(
            (account) =>
              !account.isOverdue &&
              account.daysUntilNextDue <= daysThreshold &&
              account.daysUntilNextDue >= 0,
          );
          const overdue = allAccounts.filter((account) => account.isOverdue);

          // Ordenar por proximidad al vencimiento
          dueSoon.sort((a, b) => a.daysUntilNextDue - b.daysUntilNextDue);
          overdue.sort((a, b) => a.daysUntilNextDue - b.daysUntilNextDue);

          setDueSoonAccounts(dueSoon);
          setOverdueAccounts(overdue);

          // Obtener estadísticas agregadas
          const aggregatedStats = await aggregatedStatsPromise;

          // Calcular estadísticas locales como respaldo
          const totalAmountDueSoon = dueSoon.reduce(
            (sum, account) => sum + (account.arBalance || 0),
            0,
          );
          const totalAmountOverdue = overdue.reduce(
            (sum, account) => sum + (account.arBalance || 0),
            0,
          );

          setStats({
            totalDueSoon: dueSoon.length,
            totalOverdue: overdue.length,
            totalAlerts: dueSoon.length + overdue.length,
            totalAmountDueSoon,
            totalAmountOverdue,
            averageAmount:
              aggregatedStats?.averageAmount ||
              (totalAmountDueSoon + totalAmountOverdue) /
                (dueSoon.length + overdue.length) ||
              0,
            totalAccounts: allAccounts.length,
          });

          setLoading(false);
        } catch (err) {
          console.error('Error processing due dates:', err);
          setError(err.message);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching installments:', err);
        setError(err.message);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [
    user?.businessID,
    daysThreshold,
    dateThresholds,
    cleanCache,
    fetchClientsInBatch,
    fetchInvoicesInBatch,
  ]);

  return {
    dueSoonAccounts,
    overdueAccounts,
    loading,
    error,
    stats,
  };
};

export default useDueDatesReceivable;
