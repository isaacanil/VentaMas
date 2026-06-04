import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

import type { AuditState, DomainAuditResult, DomainKey } from '../types';
import { toAuditRow } from '../utils/extractMonetary';

const PILOT_LIMIT = 20;

const orderedDomainQueries: Partial<Record<DomainKey, string[]>> = {
  invoices: ['data.date'],
  accountsReceivablePayments: ['updatedAt', 'createdAt', 'date'],
  purchases: ['updatedAt', 'createdAt'],
  expenses: ['expense.dates.createdAt', 'expense.dates.expenseDate'],
};

const resolveResult = (
  result: PromiseSettledResult<DomainAuditResult>,
  domain: DomainKey,
): DomainAuditResult => {
  if (result.status === 'fulfilled') return result.value;

  const message =
    result.reason instanceof Error
      ? result.reason.message
      : String(result.reason);

  return { domain, rows: [], error: message, loading: false };
};

const fetchDomainAudit = async (
  businessId: string,
  domain: DomainKey,
): Promise<DomainAuditResult> => {
  const colRef = collection(db, 'businesses', businessId, domain);
  const orderedFields = orderedDomainQueries[domain] ?? [];
  let snap = null;

  for (const field of orderedFields) {
    try {
      snap = await getDocs(
        query(colRef, orderBy(field, 'desc'), limit(PILOT_LIMIT)),
      );
      break;
    } catch {
      if (field === orderedFields[orderedFields.length - 1]) {
        snap = null;
      }
    }
  }

  if (!snap) {
    snap = await getDocs(query(colRef, limit(100)));
  }

  const rows = snap.docs
    .map((docSnap) =>
      toAuditRow(docSnap.id, docSnap.data() as Record<string, unknown>),
    )
    .filter((row) => domain !== 'invoices' || row.date !== null)
    .sort((left, right) => (right.date ?? 0) - (left.date ?? 0))
    .slice(0, PILOT_LIMIT);

  return { domain, rows, error: null, loading: false };
};

export const fetchAccountingAuditState = async (
  businessId: string,
): Promise<AuditState> => {
  const [invoices, payments, purchases, expenses] = await Promise.allSettled([
    fetchDomainAudit(businessId, 'invoices'),
    fetchDomainAudit(businessId, 'accountsReceivablePayments'),
    fetchDomainAudit(businessId, 'purchases'),
    fetchDomainAudit(businessId, 'expenses'),
  ]);

  return {
    invoices: resolveResult(invoices, 'invoices'),
    accountsReceivablePayments: resolveResult(
      payments,
      'accountsReceivablePayments',
    ),
    purchases: resolveResult(purchases, 'purchases'),
    expenses: resolveResult(expenses, 'expenses'),
  };
};
