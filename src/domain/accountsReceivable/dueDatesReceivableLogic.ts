import { DateTime } from 'luxon';

export type ClientData = {
  name?: string;
  tel?: string;
  phone?: string;
};

export type InvoiceData = {
  numberID?: string | number;
  date?: unknown;
  totalAmount?: number;
  status?: string;
};

export type AccountsReceivableData = {
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

export type InstallmentRecord = {
  id: string;
  arId?: string;
  installmentDate?: Date | null;
  installmentNumber?: number;
  installmentAmount?: number;
  installmentBalance?: number;
  isActive?: boolean;
};

export type AccountInstallment = {
  id: string;
  installmentNumber?: number;
  installmentAmount?: number;
  installmentBalance?: number;
  installmentDate: DateTime;
  daysUntilDue: number;
  isOverdue: boolean;
  isActive?: boolean;
};

export type DueAccount = {
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

export type Stats = {
  totalDueSoon: number;
  totalOverdue: number;
  totalAlerts: number;
  totalAmountDueSoon: number;
  totalAmountOverdue: number;
  averageAmount: number;
  totalAccounts: number;
};

export type AggregatedStats = {
  overdueCount: number;
  dueSoonCount: number;
  totalAmount: number;
  averageAmount: number;
  totalCount: number;
};

export type InstallmentCounts = { active: number; inactive: number };

const compareByMillisAsc = (a: DateTime, b: DateTime) => a.toMillis() - b.toMillis();

export function buildDueAccountsFromInstallments(params: {
  installments: InstallmentRecord[];
  accountsById: Map<string, AccountsReceivableData>;
  clientsById: Map<string, ClientData>;
  invoicesById: Map<string, InvoiceData>;
  now: DateTime;
}): DueAccount[] {
  const { installments, accountsById, clientsById, invoicesById, now } = params;

  const accountsMap = new Map<string, DueAccount>();

  for (const installment of installments) {
    const arId = installment.arId;
    const installmentDateRaw = installment.installmentDate;
    if (!arId || !(installmentDateRaw instanceof Date)) continue;

    const arData = accountsById.get(arId);
    if (!arData || !arData.isActive) continue;

    const installmentDate = DateTime.fromJSDate(installmentDateRaw);
    const daysUntilDue = installmentDate.diff(now, 'days').days;

    const clientData = arData.clientId ? clientsById.get(arData.clientId) : undefined;
    const invoiceData = arData.invoiceId ? invoicesById.get(arData.invoiceId) : undefined;

    if (!accountsMap.has(arId)) {
      accountsMap.set(arId, {
        id: arId,
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

    const account = accountsMap.get(arId);
    if (!account) continue;

    account.installments.push({
      id: installment.id,
      installmentNumber: installment.installmentNumber,
      installmentAmount: installment.installmentAmount,
      installmentBalance: installment.installmentBalance,
      installmentDate,
      daysUntilDue: Math.ceil(daysUntilDue),
      isOverdue: daysUntilDue < 0,
      isActive: installment.isActive,
    });

    if (
      installment.isActive &&
      (!account.nextDueDate || installmentDate.toMillis() < account.nextDueDate.toMillis())
    ) {
      account.nextDueDate = installmentDate;
      account.daysUntilNextDue = Math.ceil(daysUntilDue);
      account.isOverdue = daysUntilDue < 0;
    }
  }

  const allAccounts = Array.from(accountsMap.values());
  for (const account of allAccounts) {
    account.installments.sort((a, b) => compareByMillisAsc(a.installmentDate, b.installmentDate));
  }

  return allAccounts;
}

export function applyInstallmentCounts(
  accounts: DueAccount[],
  countsByArId: Record<string, InstallmentCounts>,
): DueAccount[] {
  return accounts.map((account) => {
    const counts = countsByArId[account.id];
    if (!counts) return account;

    const pendingInstallments = counts.active;
    const paidInstallments = counts.inactive;
    const totalInstallments = pendingInstallments + paidInstallments;

    return {
      ...account,
      pendingInstallments,
      paidInstallments,
      totalInstallments,
    };
  });
}

export function splitDueSoonAndOverdueAccounts(
  accounts: DueAccount[],
  daysThreshold: number,
): { dueSoon: DueAccount[]; overdue: DueAccount[] } {
  const dueSoon = accounts.filter(
    (account) =>
      !account.isOverdue &&
      account.daysUntilNextDue !== null &&
      account.daysUntilNextDue <= daysThreshold &&
      account.daysUntilNextDue >= 0,
  );
  const overdue = accounts.filter((account) => account.isOverdue);

  dueSoon.sort((a, b) => (a.daysUntilNextDue ?? 0) - (b.daysUntilNextDue ?? 0));
  overdue.sort((a, b) => (a.daysUntilNextDue ?? 0) - (b.daysUntilNextDue ?? 0));

  return { dueSoon, overdue };
}

export function computeDueDatesStats(params: {
  dueSoon: DueAccount[];
  overdue: DueAccount[];
  totalAccounts: number;
  aggregatedStats: AggregatedStats | null;
}): Stats {
  const { dueSoon, overdue, totalAccounts, aggregatedStats } = params;

  const totalAmountDueSoon = dueSoon.reduce((sum, account) => sum + (account.arBalance || 0), 0);
  const totalAmountOverdue = overdue.reduce((sum, account) => sum + (account.arBalance || 0), 0);

  const localAverage =
    (totalAmountDueSoon + totalAmountOverdue) / (dueSoon.length + overdue.length || 1);

  return {
    totalDueSoon: dueSoon.length,
    totalOverdue: overdue.length,
    totalAlerts: dueSoon.length + overdue.length,
    totalAmountDueSoon,
    totalAmountOverdue,
    averageAmount: aggregatedStats?.averageAmount || localAverage || 0,
    totalAccounts,
  };
}
