import { DateTime } from 'luxon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../features/auth/userSlice';
import type {
  AccountsReceivableData,
  ClientData,
  DueAccount,
  InvoiceData,
  Stats,
} from '@/domain/accountsReceivable/dueDatesReceivableLogic';
import {
  applyInstallmentCounts,
  buildDueAccountsFromInstallments,
  computeDueDatesStats,
  splitDueSoonAndOverdueAccounts,
} from '@/domain/accountsReceivable/dueDatesReceivableLogic';
import {
  fetchAccountsReceivableByIds,
  fetchAggregatedInstallmentStats,
  fetchClientsByIds,
  fetchInstallmentCountsByArIds,
  fetchInvoicesByIds,
  listenActiveInstallmentsForDueDates,
} from '@/firebase/accountsReceivable/dueDatesReceivable.repository';

type User = ReturnType<typeof selectUser>;

type CacheStore = {
  clients: Map<string, ClientData>;
  invoices: Map<string, InvoiceData>;
  accounts: Map<string, AccountsReceivableData>;
  lastUpdated: number | null;
};

const EMPTY_STATS: Stats = {
  totalDueSoon: 0,
  totalOverdue: 0,
  totalAlerts: 0,
  totalAmountDueSoon: 0,
  totalAmountOverdue: 0,
  averageAmount: 0,
  totalAccounts: 0,
};

/**
 * Hook personalizado para obtener cuentas por cobrar próximas a vencer.
 * Infra Firestore vive en: src/firebase/accountsReceivable/dueDatesReceivable.repository.ts
 * Lógica de dominio vive en: src/domain/accountsReceivable/dueDatesReceivableLogic.ts
 */
export const useDueDatesReceivable = (daysThreshold = 7) => {
  const user = useSelector(selectUser) as User;
  const businessId = user?.businessID || null;

  // Memoizar fechas para evitar recálculos innecesarios
  const dateThresholds = useMemo(() => {
    const now = DateTime.now().startOf('day');
    const futureLimit = now.plus({ days: daysThreshold }).endOf('day');
    return { now, futureLimit };
  }, [daysThreshold]);

  // Cache local para datos relacionados (evita refetch repetido en snapshots)
  const dataCacheRef = useRef<CacheStore>({
    clients: new Map(),
    invoices: new Map(),
    accounts: new Map(),
    lastUpdated: null,
  });

  const cleanCache = useCallback(() => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (
      !dataCacheRef.current.lastUpdated ||
      dataCacheRef.current.lastUpdated < fiveMinutesAgo
    ) {
      dataCacheRef.current = {
        clients: new Map(),
        invoices: new Map(),
        accounts: new Map(),
        lastUpdated: Date.now(),
      };
    }
  }, []);

  const listenerKey = businessId ? `${businessId}|${daysThreshold}` : null;

  const [state, setState] = useState<{
    key: string | null;
    dueSoon: DueAccount[];
    overdue: DueAccount[];
    stats: Stats;
    error: string | null;
  }>({
    key: null,
    dueSoon: [],
    overdue: [],
    stats: EMPTY_STATS,
    error: null,
  });

  useEffect(() => {
    if (!businessId || !listenerKey) return;

    cleanCache();

    const { now, futureLimit } = dateThresholds;

    return listenActiveInstallmentsForDueDates({
      businessId,
      futureLimit: futureLimit.toJSDate(),
      onData: async (installments) => {
        try {
          if (!Array.isArray(installments) || installments.length === 0) {
            setState({
              key: listenerKey,
              dueSoon: [],
              overdue: [],
              stats: { ...EMPTY_STATS, totalAccounts: 0 },
              error: null,
            });
            return;
          }

          const dataCache = dataCacheRef.current;

          const aggregatedStatsPromise = fetchAggregatedInstallmentStats({
            businessId,
            now: now.toJSDate(),
            futureLimit: futureLimit.toJSDate(),
          });

          const arIds = Array.from(
            new Set(
              installments
                .map((i) => (typeof i.arId === 'string' ? i.arId : null))
                .filter(Boolean),
            ),
          ) as string[];

          // 1) Load AR docs (batched by Firestore limits) and cache them
          const arDocs = await fetchAccountsReceivableByIds({ businessId, arIds });

          const clientIds = new Set<string>();
          const invoiceIds = new Set<string>();

          for (const { id, data } of arDocs) {
            if (!data?.isActive) continue;
            dataCache.accounts.set(id, data);
            if (data.clientId) clientIds.add(data.clientId);
            if (data.invoiceId) invoiceIds.add(data.invoiceId);
          }

          // 2) Load related clients/invoices and cache them
          const uncachedClientIds = Array.from(clientIds).filter(
            (id) => !dataCache.clients.has(id),
          );
          const uncachedInvoiceIds = Array.from(invoiceIds).filter(
            (id) => !dataCache.invoices.has(id),
          );

          const [clients, invoices] = await Promise.all([
            fetchClientsByIds({ businessId, clientIds: uncachedClientIds }),
            fetchInvoicesByIds({ businessId, invoiceIds: uncachedInvoiceIds }),
          ]);

          for (const c of clients) dataCache.clients.set(c.id, c.data);
          for (const inv of invoices) dataCache.invoices.set(inv.id, inv.data);

          // 3) Build domain accounts (pure logic)
          const allAccountsBase = buildDueAccountsFromInstallments({
            installments,
            accountsById: dataCache.accounts,
            clientsById: dataCache.clients,
            invoicesById: dataCache.invoices,
            now,
          });

          // 4) Enrich with counts (still infra), then split and compute stats
          const countsByArId = await fetchInstallmentCountsByArIds({
            businessId,
            arIds: allAccountsBase.map((a) => a.id),
          });

          const allAccounts = applyInstallmentCounts(allAccountsBase, countsByArId);
          const { dueSoon, overdue } = splitDueSoonAndOverdueAccounts(
            allAccounts,
            daysThreshold,
          );

          const aggregatedStats = await aggregatedStatsPromise;
          const stats = computeDueDatesStats({
            dueSoon,
            overdue,
            totalAccounts: allAccounts.length,
            aggregatedStats,
          });

          setState({
            key: listenerKey,
            dueSoon,
            overdue,
            stats,
            error: null,
          });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setState({
            key: listenerKey,
            dueSoon: [],
            overdue: [],
            stats: EMPTY_STATS,
            error: message,
          });
        }
      },
      onError: (err) => {
        const message = err instanceof Error ? err.message : 'Unknown error';
        setState({
          key: listenerKey,
          dueSoon: [],
          overdue: [],
          stats: EMPTY_STATS,
          error: message,
        });
      },
    });
  }, [businessId, listenerKey, dateThresholds, daysThreshold, cleanCache]);

  const loading = !!listenerKey && state.key !== listenerKey;

  return {
    dueSoonAccounts: state.key === listenerKey ? state.dueSoon : [],
    overdueAccounts: state.key === listenerKey ? state.overdue : [],
    loading,
    error: state.key === listenerKey ? state.error : null,
    stats: state.key === listenerKey ? state.stats : EMPTY_STATS,
  };
};

export default useDueDatesReceivable;

