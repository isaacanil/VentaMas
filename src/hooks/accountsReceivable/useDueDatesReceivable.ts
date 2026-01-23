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

type User = ReturnType<typeof selectUser>;

type ClientData = {
  name?: string;
  tel?: string;
  phone?: string;
};

type InvoiceData = {
  numberID?: string | number;
  date?: unknown;
  totalAmount?: number;
  status?: string;
};

type AccountsReceivableData = {
  isActive?: boolean;
  clientId?: string;
  invoiceId?: string;
  totalReceivable?: number;
  arBalance?: number;
  createdAt?: unknown;
  numberId?: string | number;
  paymentFrequency?: string;
  totalInstallments?: number;
  type?: string;
  insurance?: unknown;
};

type InstallmentData = {
  arId?: string;
  installmentDate?: { toDate: () => Date };
  installmentNumber?: number;
  installmentAmount?: number;
  installmentBalance?: number;
  isActive?: boolean;
};

type AccountInstallment = {
  id: string;
  installmentNumber?: number;
  installmentAmount?: number;
  installmentBalance?: number;
  installmentDate: DateTime;
  daysUntilDue: number;
  isOverdue: boolean;
  isActive?: boolean;
};

type DueAccount = {
  id: string;
  invoiceId?: string;
  invoiceNumber?: string | number;
  clientId?: string;
  clientName: string;
  clientPhone: string;
  totalReceivable?: number;
  arBalance?: number;
  createdAt?: unknown;
  installments: AccountInstallment[];
  nextDueDate: DateTime | null;
  daysUntilNextDue: number | null;
  isOverdue: boolean;
  numberId?: string | number;
  paymentFrequency?: string;
  totalInstallments?: number;
  type?: string;
  insurance?: unknown;
  invoiceDate?: unknown;
  invoiceTotal?: number;
  invoiceStatus?: string;
  pendingInstallments: number;
  paidInstallments: number;
};

type Stats = {
  totalDueSoon: number;
  totalOverdue: number;
  totalAlerts: number;
  totalAmountDueSoon: number;
  totalAmountOverdue: number;
  averageAmount: number;
  totalAccounts: number;
};

type AggregatedStats = {
  overdueCount: number;
  dueSoonCount: number;
  totalAmount: number;
  averageAmount: number;
  totalCount: number;
};

type CacheStore = {
  clients: Map<string, ClientData>;
  invoices: Map<string, InvoiceData>;
  accounts: Map<string, AccountsReceivableData>;
  lastUpdated: number | null;
};

/**
 * Hook personalizado para obtener cuentas por cobrar próximas a vencer
 * Optimizado con funciones recientes de Firebase Firestore v10+
 * Incluye agregaciones, consultas compuestas y cache inteligente
 * @param {number} daysThreshold - Días de anticipación para considerar "próximo a vencer" (default: 7)
 * @returns {Object} { dueSoonAccounts, overdueAccounts, loading, error, stats }
 */
export const useDueDatesReceivable = (daysThreshold = 7) => {
  const [dueSoonAccounts, setDueSoonAccounts] = useState<DueAccount[]>([]);
  const [overdueAccounts, setOverdueAccounts] = useState<DueAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({
    totalDueSoon: 0,
    totalOverdue: 0,
    totalAlerts: 0,
    totalAmountDueSoon: 0,
    totalAmountOverdue: 0,
    averageAmount: 0,
    totalAccounts: 0,
  });

  const user = useSelector(selectUser) as User;

  // Memoizar fechas para evitar recálculos innecesarios
  const dateThresholds = useMemo(() => {
    const now = DateTime.now().startOf('day');
    const futureLimit = now.plus({ days: daysThreshold }).endOf('day');
    return { now, futureLimit };
  }, [daysThreshold]);

  // Cache para datos relacionados - usar useRef para evitar problemas de dependencias
  const dataCacheRef = useRef<CacheStore>({
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
    async (clientIds: string[]) => {
      if (!user?.businessID) return;
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

        clientsSnap.forEach((docSnap) => {
          const clientData = docSnap.data() as { client?: ClientData } & ClientData;
          dataCache.clients.set(docSnap.id, clientData.client || clientData);
        });

        // Si hay más de 10 clientes, hacer consultas adicionales
        if (uncachedClientIds.length > 10) {
          const remainingIds = uncachedClientIds.slice(10);
          const batches: string[][] = [];
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
            snapshot.forEach((docSnap) => {
              const clientData = docSnap.data() as { client?: ClientData } & ClientData;
              dataCache.clients.set(docSnap.id, clientData.client || clientData);
            });
          });
        }
      } catch (err) {
        console.warn('Error fetching clients in batch:', err);
      }
    },
    [user?.businessID],
  );

  // Función optimizada para obtener datos de facturas en lote
  const fetchInvoicesInBatch = useCallback(
    async (invoiceIds: string[]) => {
      if (!user?.businessID) return;
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

        invoicesSnap.forEach((docSnap) => {
          const invoiceData = docSnap.data() as { data?: InvoiceData } & InvoiceData;
          dataCache.invoices.set(docSnap.id, invoiceData.data || invoiceData);
        });

        // Manejar lotes adicionales si hay más de 10 facturas
        if (uncachedInvoiceIds.length > 10) {
          const remainingIds = uncachedInvoiceIds.slice(10);
          const batches: string[][] = [];
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
            snapshot.forEach((docSnap) => {
              const invoiceData = docSnap.data() as { data?: InvoiceData } & InvoiceData;
              dataCache.invoices.set(docSnap.id, invoiceData.data || invoiceData);
            });
          });
        }
      } catch (err) {
        console.warn('Error fetching invoices in batch:', err);
      }
    },
    [user?.businessID],
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
    const getAggregatedStats = async (): Promise<AggregatedStats | null> => {
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

        const aggregateData = aggregateSnapshot.data() as {
          totalAmount?: number;
          averageAmount?: number;
          totalCount?: number;
        };

        return {
          overdueCount: overdueCount.data().count,
          dueSoonCount: dueSoonCount.data().count,
          totalAmount: aggregateData.totalAmount || 0,
          averageAmount: aggregateData.averageAmount || 0,
          totalCount: aggregateData.totalCount || 0,
        };
      } catch (err) {
        console.warn('Error getting aggregated stats:', err);
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

          const accountsMap = new Map<string, DueAccount>();
          const clientIds = new Set<string>();
          const invoiceIds = new Set<string>();
          const arIds = new Set<string>();

          // Primera pasada: recopilar IDs únicos
          querySnapshot.forEach((docSnap) => {
            const installment = docSnap.data() as InstallmentData;
            if (installment.arId) {
              arIds.add(installment.arId);
            }
          });

          // Obtener datos de cuentas por cobrar en lote
          const arRef = collection(
            db,
            'businesses',
            user.businessID,
            'accountsReceivable',
          );
          const arIdsArray = Array.from(arIds);
          const arBatches: string[][] = [];

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
            snapshot.forEach((docSnap) => {
              const arData = docSnap.data() as AccountsReceivableData;
              if (arData.isActive) {
                dataCache.accounts.set(docSnap.id, arData);
                if (arData.clientId) {
                  clientIds.add(arData.clientId);
                }
                if (arData.invoiceId) {
                  invoiceIds.add(arData.invoiceId);
                }
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
            const installment = docSnap.data() as InstallmentData;
            if (!installment.arId || !installment.installmentDate?.toDate) return;

            const installmentDate = DateTime.fromJSDate(
              installment.installmentDate.toDate(),
            );
            const daysUntilDue = installmentDate.diff(now, 'days').days;

            const arData = dataCache.accounts.get(installment.arId);
            if (!arData || !arData.isActive) return;

            const clientData = arData.clientId
              ? dataCache.clients.get(arData.clientId)
              : undefined;
            const invoiceData = arData.invoiceId
              ? dataCache.invoices.get(arData.invoiceId)
              : undefined;

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
            if (!account) return;

            account.installments.push({
              id: docSnap.id,
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
              (!account.nextDueDate || installmentDate.toMillis() < account.nextDueDate.toMillis())
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
              } catch (err) {
                console.warn(
                  `Error fetching installment counts for AR ${arId}:`,
                  err,
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
              (a, b) => a.installmentDate.toMillis() - b.installmentDate.toMillis(),
            );
          });

          const dueSoon = allAccounts.filter(
            (account) =>
              !account.isOverdue &&
              account.daysUntilNextDue !== null &&
              account.daysUntilNextDue <= daysThreshold &&
              account.daysUntilNextDue >= 0,
          );
          const overdue = allAccounts.filter((account) => account.isOverdue);

          // Ordenar por proximidad al vencimiento
          dueSoon.sort(
            (a, b) => (a.daysUntilNextDue ?? 0) - (b.daysUntilNextDue ?? 0),
          );
          overdue.sort(
            (a, b) => (a.daysUntilNextDue ?? 0) - (b.daysUntilNextDue ?? 0),
          );

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
          const message = err instanceof Error ? err.message : 'Unknown error';
          setError(message);
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching installments:', err);
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
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
