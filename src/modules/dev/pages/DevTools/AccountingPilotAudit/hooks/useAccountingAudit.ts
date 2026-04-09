import { useCallback, useState } from 'react';
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
} from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { toAuditRow } from '../utils/extractMonetary';
import type { AuditState, DomainAuditResult, DomainKey } from '../types';

const PILOT_LIMIT = 20;

const orderedDomainQueries: Partial<Record<DomainKey, string[]>> = {
  invoices: ['data.date'],
  accountsReceivablePayments: ['updatedAt', 'createdAt', 'date'],
  purchases: ['updatedAt', 'createdAt'],
  expenses: ['expense.dates.createdAt', 'expense.dates.expenseDate'],
};

const emptyResult = (domain: DomainKey): DomainAuditResult => ({
  domain,
  rows: [],
  error: null,
  loading: false,
});

const loadingResult = (domain: DomainKey): DomainAuditResult => ({
  ...emptyResult(domain),
  loading: true,
});

const initialState: AuditState = {
  invoices: emptyResult('invoices'),
  accountsReceivablePayments: emptyResult('accountsReceivablePayments'),
  purchases: emptyResult('purchases'),
  expenses: emptyResult('expenses'),
};

const fetchDomain = async (
  businessId: string,
  collectionName: string,
): Promise<DomainAuditResult> => {
  const domain = collectionName as DomainKey;
  const colRef = collection(db, 'businesses', businessId, collectionName);
  const orderedFields = orderedDomainQueries[domain] ?? [];
  let snap = null;

  for (const field of orderedFields) {
    try {
      snap = await getDocs(query(colRef, orderBy(field, 'desc'), limit(PILOT_LIMIT)));
      break;
    } catch (error) {
      if (field === orderedFields[orderedFields.length - 1]) {
        snap = null;
      }
    }
  }

  if (!snap) {
    snap = await getDocs(query(colRef, limit(100)));
  }

  const rows = snap.docs
    .map((docSnap) => toAuditRow(docSnap.id, docSnap.data() as Record<string, unknown>))
    .filter((row) => domain !== 'invoices' || row.date !== null)
    .sort((left, right) => (right.date ?? 0) - (left.date ?? 0))
    .slice(0, PILOT_LIMIT);

  return { domain, rows, error: null, loading: false };
};

export const useAccountingAudit = () => {
  const [state, setState] = useState<AuditState>(initialState);

  const refresh = useCallback((businessId: string) => {
    if (!businessId) return;

    setState({
      invoices: loadingResult('invoices'),
      accountsReceivablePayments: loadingResult('accountsReceivablePayments'),
      purchases: loadingResult('purchases'),
      expenses: loadingResult('expenses'),
    });

    const run = async () => {
      const [invoices, payments, purchases, expenses] = await Promise.allSettled([
        fetchDomain(businessId, 'invoices'),
        fetchDomain(businessId, 'accountsReceivablePayments'),
        fetchDomain(businessId, 'purchases'),
        fetchDomain(businessId, 'expenses'),
      ]);

      const resolve = (result: PromiseSettledResult<DomainAuditResult>, domain: DomainKey): DomainAuditResult => {
        if (result.status === 'fulfilled') return result.value;
        const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        return { domain, rows: [], error: msg, loading: false };
      };

      setState({
        invoices: resolve(invoices, 'invoices'),
        accountsReceivablePayments: resolve(payments, 'accountsReceivablePayments'),
        purchases: resolve(purchases, 'purchases'),
        expenses: resolve(expenses, 'expenses'),
      });
    };

    run();
  }, []);

  return { state, refresh };
};
