import {
  collection,
  getCountFromServer,
  getDocs,
  limit as limitDocs,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import {
  DEFAULT_SAMPLE_LIMIT,
  FIRESTORE_IN_LIMIT,
  MAX_SAMPLE_LIMIT,
} from '../constants';

import {
  chunkArray,
  mapAccountsReceivableDoc,
  mapInvoiceDoc,
} from '../utils/firestoreMappers';

import type {
  ReceivableAuditInvoice,
  ReceivablesLookup,
} from '@/utils/accountsReceivable/types';

interface UseReceivableInvoicesOptions {
  defaultLimit?: number;
}

interface FetchResultState {
  receivableInvoices: ReceivableAuditInvoice[];
  receivablesByInvoice: ReceivablesLookup;
  missingReceivableInvoices: ReceivableAuditInvoice[];
  lastUpdated: number | null;
  totalCreditInvoicesCount: number | null;
  loading: boolean;
  error: string | null;
  fetchInvoices: (limitValue?: number | string) => Promise<void>;
}

interface ReceivableInvoicesState {
  requestKey: string | null;
  receivableInvoices: ReceivableAuditInvoice[];
  receivablesByInvoice: ReceivablesLookup;
  totalCreditInvoicesCount: number | null;
  lastUpdated: number | null;
  error: string | null;
}

const EMPTY_RECEIVABLE_INVOICES: ReceivableAuditInvoice[] = [];
const EMPTY_RECEIVABLES_BY_INVOICE: ReceivablesLookup = {};

const INITIAL_RECEIVABLE_INVOICES_STATE: ReceivableInvoicesState = {
  requestKey: null,
  receivableInvoices: EMPTY_RECEIVABLE_INVOICES,
  receivablesByInvoice: EMPTY_RECEIVABLES_BY_INVOICE,
  totalCreditInvoicesCount: null,
  lastUpdated: null,
  error: null,
};

const normalizeLimitValue = (value?: number | string): number => {
  const numericValue =
    value !== undefined && value !== null
      ? Number(value)
      : DEFAULT_SAMPLE_LIMIT;
  const fallback = Number.isFinite(numericValue)
    ? numericValue
    : DEFAULT_SAMPLE_LIMIT;
  return Math.min(Math.max(Math.floor(fallback), 1), MAX_SAMPLE_LIMIT);
};

export const useReceivableInvoices = (
  businessId: string | null,
  options: UseReceivableInvoicesOptions = {},
): FetchResultState => {
  const defaultLimit =
    options?.defaultLimit && Number.isFinite(options.defaultLimit)
      ? Number(options.defaultLimit)
      : DEFAULT_SAMPLE_LIMIT;

  const [resultState, setResultState] = useState<ReceivableInvoicesState>(
    INITIAL_RECEIVABLE_INVOICES_STATE,
  );
  const [loadingRequestKey, setLoadingRequestKey] = useState<string | null>(
    null,
  );

  const fetchReceivablesByInvoiceIds = useCallback(
    async (invoiceIds: string[]): Promise<ReceivablesLookup> => {
      if (!businessId || !invoiceIds.length) return {};
      const uniqueIds = Array.from(new Set(invoiceIds.filter(Boolean)));
      if (!uniqueIds.length) return {};

      const receivablesRef = collection(
        db,
        'businesses',
        businessId,
        'accountsReceivable',
      );

      const chunks = chunkArray(uniqueIds, FIRESTORE_IN_LIMIT).filter(
        (chunk) => chunk.length,
      );
      const results = await Promise.all(
        chunks.map(async (chunk) => {
          const snap = await getDocs(
            query(receivablesRef, where('invoiceId', 'in', chunk)),
          );
          return snap.docs.map(mapAccountsReceivableDoc);
        }),
      );

      return results
        .flat()
        .filter((doc) => doc.invoiceId)
        .reduce<ReceivablesLookup>((acc, doc) => {
          acc[doc.invoiceId] = doc;
          return acc;
        }, {});
    },
    [businessId],
  );

  const fetchInvoices = useCallback(
    async (limitValue?: number | string) => {
      if (!businessId) return;

      const requestKey = businessId;
      const normalizedLimit = normalizeLimitValue(limitValue ?? defaultLimit);

      setLoadingRequestKey(requestKey);
      try {
        const invoicesRef = collection(
          db,
          'businesses',
          requestKey,
          'invoices',
        );
        const invoicesBaseQuery = query(
          invoicesRef,
          where('data.isAddedToReceivables', '==', true),
        );
        const invoicesQuery = query(
          invoicesBaseQuery,
          orderBy('data.date', 'desc'),
          limitDocs(normalizedLimit),
        );
        const [snap, countSnap] = await Promise.all([
          getDocs(invoicesQuery),
          getCountFromServer(invoicesBaseQuery),
        ]);
        const totalCount = countSnap.data()?.count ?? 0;
        const rows = snap.docs.map(mapInvoiceDoc);
        const invoiceIds = rows.map((invoice) => invoice.invoiceId);
        const receivableMap = await fetchReceivablesByInvoiceIds(invoiceIds);
        setResultState({
          requestKey,
          receivableInvoices: rows,
          receivablesByInvoice: receivableMap,
          totalCreditInvoicesCount: totalCount,
          lastUpdated: Date.now(),
          error: null,
        });
      } catch (err: unknown) {
        const errorObj = err as { code?: string; message?: string };
        console.error(
          '[useReceivableInvoices] Failed to load receivable invoices',
          err,
        );
        const friendlyMessage =
          errorObj?.code === 'permission-denied'
            ? 'No tienes permisos para leer las facturas en este negocio.'
            : errorObj?.code === 'failed-precondition'
              ? 'Firestore requiere un índice compuesto para esta consulta. Crea el índice sugerido en la consola y vuelve a intentarlo.'
              : errorObj?.message || 'No se pudieron obtener las facturas.';
        setResultState({
          requestKey,
          receivableInvoices: EMPTY_RECEIVABLE_INVOICES,
          receivablesByInvoice: EMPTY_RECEIVABLES_BY_INVOICE,
          totalCreditInvoicesCount: null,
          lastUpdated: null,
          error: friendlyMessage,
        });
      } finally {
        setLoadingRequestKey((currentRequestKey) =>
          currentRequestKey === requestKey ? null : currentRequestKey,
        );
      }
    },
    [businessId, defaultLimit, fetchReceivablesByInvoiceIds],
  );

  useEffect(() => {
    if (!businessId) return;
    void fetchInvoices(defaultLimit);
  }, [businessId, defaultLimit, fetchInvoices]);

  const hasCurrentResult =
    Boolean(businessId) && resultState.requestKey === businessId;
  const receivableInvoices = hasCurrentResult
    ? resultState.receivableInvoices
    : EMPTY_RECEIVABLE_INVOICES;
  const receivablesByInvoice = hasCurrentResult
    ? resultState.receivablesByInvoice
    : EMPTY_RECEIVABLES_BY_INVOICE;
  const lastUpdated = hasCurrentResult ? resultState.lastUpdated : null;
  const totalCreditInvoicesCount = hasCurrentResult
    ? resultState.totalCreditInvoicesCount
    : null;
  const loading = Boolean(businessId) && loadingRequestKey === businessId;
  const error = hasCurrentResult ? resultState.error : null;

  const missingReceivableInvoices = useMemo(
    () =>
      receivableInvoices.filter(
        (invoice) => !receivablesByInvoice[invoice.invoiceId],
      ),
    [receivableInvoices, receivablesByInvoice],
  );

  return {
    receivableInvoices,
    receivablesByInvoice,
    missingReceivableInvoices,
    lastUpdated,
    totalCreditInvoicesCount,
    loading,
    error,
    fetchInvoices,
  };
};
