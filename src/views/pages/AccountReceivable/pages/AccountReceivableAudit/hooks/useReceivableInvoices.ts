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
} from '@/views/pages/AccountReceivable/pages/AccountReceivableAudit/constants';

import {
  chunkArray,
  mapAccountsReceivableDoc,
  mapInvoiceDoc,
} from '../utils/firestoreMappers';

import type {
  ReceivableInvoice,
  ReceivablesLookup,
} from '@/views/pages/AccountReceivable/pages/AccountReceivableAudit/types';

interface UseReceivableInvoicesOptions {
  defaultLimit?: number;
}

interface FetchResultState {
  receivableInvoices: ReceivableInvoice[];
  receivablesByInvoice: ReceivablesLookup;
  missingReceivableInvoices: ReceivableInvoice[];
  lastUpdated: number | null;
  totalCreditInvoicesCount: number | null;
  loading: boolean;
  error: string | null;
  fetchInvoices: (limitValue?: number | string) => Promise<void>;
}

const normalizeLimitValue = (value?: number | string): number => {
  const numericValue =
    value !== undefined && value !== null ? Number(value) : DEFAULT_SAMPLE_LIMIT;
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

  const [receivableInvoices, setReceivableInvoices] = useState<
    ReceivableInvoice[]
  >([]);
  const [receivablesByInvoice, setReceivablesByInvoice] =
    useState<ReceivablesLookup>({});
  const [totalCreditInvoicesCount, setTotalCreditInvoicesCount] = useState<
    number | null
  >(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!businessId) {
        setReceivableInvoices([]);
        setReceivablesByInvoice({});
        setTotalCreditInvoicesCount(null);
        setLastUpdated(null);
        setError(null);
        return;
      }

      const normalizedLimit = normalizeLimitValue(
        limitValue ?? defaultLimit,
      );

      setLoading(true);
      setError(null);
      try {
        const invoicesRef = collection(
          db,
          'businesses',
          businessId,
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
        setTotalCreditInvoicesCount(totalCount);
        const rows = snap.docs.map(mapInvoiceDoc);
        setReceivableInvoices(rows);
        const invoiceIds = rows.map((invoice) => invoice.invoiceId);
        const receivableMap = await fetchReceivablesByInvoiceIds(invoiceIds);
        setReceivablesByInvoice(receivableMap);
        setLastUpdated(Date.now());
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
        setError(friendlyMessage);
        setReceivableInvoices([]);
        setReceivablesByInvoice({});
        setTotalCreditInvoicesCount(null);
      } finally {
        setLoading(false);
      }
    },
    [businessId, defaultLimit, fetchReceivablesByInvoiceIds],
  );

  useEffect(() => {
    if (!businessId) {
      setReceivableInvoices([]);
      setReceivablesByInvoice({});
      setTotalCreditInvoicesCount(null);
      setLastUpdated(null);
      setError(null);
      return;
    }
    void fetchInvoices(defaultLimit);
  }, [businessId, defaultLimit, fetchInvoices]);

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
