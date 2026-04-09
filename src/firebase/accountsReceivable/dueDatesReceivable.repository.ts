import {
  average,
  collection,
  count,
  documentId,
  getAggregateFromServer,
  getCountFromServer,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  sum,
  where,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type {
  AccountsReceivableData,
  AggregatedStats,
  ClientData,
  InstallmentCounts,
  InstallmentRecord,
  InvoiceData,
} from '@/domain/accountsReceivable/dueDatesReceivableLogic';

const asDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as { toDate?: () => Date })?.toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'number' || typeof value === 'string') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
};

export function listenActiveInstallmentsForDueDates(params: {
  businessId: string;
  futureLimit: Date;
  onData: (installments: InstallmentRecord[]) => void;
  onError?: (error: unknown) => void;
}): Unsubscribe {
  const { businessId, futureLimit, onData, onError } = params;
  // eslint_disable-next-line @typescript-eslint/no-empty-function
  const noOp: Unsubscribe = () => {};

  if (!businessId || !futureLimit || !onData) return noOp;

  const installmentsRef = collection(
    db,
    'businesses',
    businessId,
    'accountsReceivableInstallments',
  );
  const installmentsQuery = query(
    installmentsRef,
    where('installmentDate', '<=', futureLimit),
    where('isActive', '==', true),
    orderBy('installmentDate', 'asc'),
  );

  return onSnapshot(
    installmentsQuery,
    (snap) => {
      const installments: InstallmentRecord[] = snap.docs.map((docSnap) => {
        const data = docSnap.data() as Record<string, unknown>;
        return {
          id: docSnap.id,
          arId: typeof data.arId === 'string' ? data.arId : String(data.arId ?? ''),
          installmentDate: asDate(data.installmentDate),
          installmentNumber:
            typeof data.installmentNumber === 'number'
              ? data.installmentNumber
              : undefined,
          installmentAmount:
            typeof data.installmentAmount === 'number'
              ? data.installmentAmount
              : undefined,
          installmentBalance:
            typeof data.installmentBalance === 'number'
              ? data.installmentBalance
              : undefined,
          isActive: data.isActive as boolean | undefined,
        };
      });
      onData(installments);
    },
    (error) => {
      if (onError) onError(error);
      onData([]);
    },
  );
}

const batchBy10 = <T,>(items: T[]): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += 10) out.push(items.slice(i, i + 10));
  return out;
};

export async function fetchAccountsReceivableByIds(params: {
  businessId: string;
  arIds: string[];
}): Promise<Array<{ id: string; data: AccountsReceivableData }>> {
  const { businessId, arIds } = params;
  if (!businessId || !Array.isArray(arIds) || arIds.length === 0) return [];

  const arRef = collection(db, 'businesses', businessId, 'accountsReceivable');
  const batches = batchBy10(arIds);
  const snaps = await Promise.all(
    batches.map((batch) => getDocs(query(arRef, where(documentId(), 'in', batch)))),
  );

  const results: Array<{ id: string; data: AccountsReceivableData }> = [];
  for (const snap of snaps) {
    snap.forEach((docSnap) => {
      results.push({ id: docSnap.id, data: docSnap.data() as AccountsReceivableData });
    });
  }
  return results;
}

export async function fetchClientsByIds(params: {
  businessId: string;
  clientIds: string[];
}): Promise<Array<{ id: string; data: ClientData }>> {
  const { businessId, clientIds } = params;
  if (!businessId || !Array.isArray(clientIds) || clientIds.length === 0) return [];

  const clientsRef = collection(db, 'businesses', businessId, 'clients');
  const batches = batchBy10(clientIds);
  const snaps = await Promise.all(
    batches.map((batch) =>
      getDocs(query(clientsRef, where(documentId(), 'in', batch))),
    ),
  );

  const results: Array<{ id: string; data: ClientData }> = [];
  for (const snap of snaps) {
    snap.forEach((docSnap) => {
      const raw = docSnap.data() as { client?: ClientData } & ClientData;
      results.push({ id: docSnap.id, data: raw.client || raw });
    });
  }
  return results;
}

export async function fetchInvoicesByIds(params: {
  businessId: string;
  invoiceIds: string[];
}): Promise<Array<{ id: string; data: InvoiceData }>> {
  const { businessId, invoiceIds } = params;
  if (!businessId || !Array.isArray(invoiceIds) || invoiceIds.length === 0) return [];

  const invoicesRef = collection(db, 'businesses', businessId, 'invoices');
  const batches = batchBy10(invoiceIds);
  const snaps = await Promise.all(
    batches.map((batch) =>
      getDocs(query(invoicesRef, where(documentId(), 'in', batch))),
    ),
  );

  const results: Array<{ id: string; data: InvoiceData }> = [];
  for (const snap of snaps) {
    snap.forEach((docSnap) => {
      const raw = docSnap.data() as { data?: InvoiceData } & InvoiceData;
      results.push({ id: docSnap.id, data: raw.data || raw });
    });
  }
  return results;
}

export async function fetchAggregatedInstallmentStats(params: {
  businessId: string;
  now: Date;
  futureLimit: Date;
}): Promise<AggregatedStats | null> {
  const { businessId, now, futureLimit } = params;
  if (!businessId) return null;

  try {
    const installmentsRef = collection(
      db,
      'businesses',
      businessId,
      'accountsReceivableInstallments',
    );

    const overdueQuery = query(
      installmentsRef,
      where('installmentDate', '<', now),
      where('isActive', '==', true),
    );
    const dueSoonQuery = query(
      installmentsRef,
      where('installmentDate', '>=', now),
      where('installmentDate', '<=', futureLimit),
      where('isActive', '==', true),
    );

    const [overdueCount, dueSoonCount] = await Promise.all([
      getCountFromServer(overdueQuery),
      getCountFromServer(dueSoonQuery),
    ]);

    const forAmounts = query(
      installmentsRef,
      where('installmentDate', '<=', futureLimit),
      where('isActive', '==', true),
    );

    const aggregateSnapshot = await getAggregateFromServer(forAmounts, {
      totalAmount: sum('installmentBalance'),
      averageAmount: average('installmentBalance'),
      totalCount: count(),
    });

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
  } catch {
    return null;
  }
}

export async function fetchInstallmentCountsByArIds(params: {
  businessId: string;
  arIds: string[];
}): Promise<Record<string, InstallmentCounts>> {
  const { businessId, arIds } = params;
  if (!businessId || !Array.isArray(arIds) || arIds.length === 0) return {};

  const col = collection(
    db,
    'businesses',
    businessId,
    'accountsReceivableInstallments',
  );

  const pairs = await Promise.all(
    arIds.map(async (arId) => {
      try {
        const base = query(col, where('arId', '==', arId));
        const [activeCount, inactiveCount] = await Promise.all([
          getCountFromServer(query(base, where('isActive', '==', true))),
          getCountFromServer(query(base, where('isActive', '==', false))),
        ]);
        return [
          arId,
          { active: activeCount.data().count, inactive: inactiveCount.data().count },
        ] as const;
      } catch {
        return [arId, { active: 0, inactive: 0 }] as const;
      }
    }),
  );

  return pairs.reduce<Record<string, InstallmentCounts>>((acc, [arId, counts]) => {
    acc[arId] = counts;
    return acc;
  }, {});
}

