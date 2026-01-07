import { DateTime } from 'luxon';

import type { AccountsReceivableDoc } from '@/utils/accountsReceivable/types';

export function calculateRemainingBalance(
  totalDue: number,
  paymentMade: number,
): number {
  return totalDue - paymentMade;
}
export function calculateAmountPerInstallment(
  remainingBalance: number,
  numberOfInstallments: number,
) {
  if (numberOfInstallments > 0) {
    return Number(remainingBalance) / Number(numberOfInstallments);
  }
  return 0; // Evita la división por cero
}
export function calculateTotalCredit(remainingBalance: number) {
  return remainingBalance;
}
export function calculateTotalActiveBalance(accounts: AccountsReceivableDoc[]) {
  return accounts
    .filter((account) => account.isActive && (account.arBalance ?? 0) > 0)
    .reduce((total, account) => total + (account.arBalance ?? 0), 0);
}

export const convertAccountsData = (data: AccountsReceivableDoc[]) => {
  return data.map((account) => {
    const createdAtSeconds =
      typeof account?.createdAt === 'object' &&
      account?.createdAt &&
      'seconds' in account.createdAt
        ? (account.createdAt as { seconds?: number }).seconds
        : null;
    const date = createdAtSeconds
      ? DateTime.fromSeconds(createdAtSeconds).toFormat('dd/MM/yyyy')
      : 'N/A';
    let frequency;
    if (account.paymentFrequency === 'monthly') {
      frequency = 'Mensual';
    } else if (account.paymentFrequency === 'weekly') {
      frequency = 'Semanal';
    } else {
      frequency = account.paymentFrequency; // En caso de que haya otra frecuencia no contemplada
    }
    const balance = account.arBalance ?? 0;
    const installments = account.totalInstallments ?? 0;
    const isActive = account.isActive ?? false;

    return {
      ...account,
      date,
      frequency,
      balance,
      installments,
      isActive,
    };
  });
};

export const PAYMENT_SCOPE = {
  balance: 'Pago a balance',
  account: 'Pago a cuenta',
};
export const PAYMENT_OPTIONS = {
  installment: {
    name: 'installment',
    text: 'Cuota',
  },
  accountBalance: {
    name: 'balance',
    text: 'Balance de cuenta',
  },
  accountPayment: {
    name: 'partial',
    text: 'Abono a cuenta',
  },
};
