import {
  formatAccountingMoney,
  type GeneralLedgerMovement,
} from '../../utils/accountingWorkspace';

export interface VisibleLedgerMetrics {
  openingBalance: number;
  periodDebit: number;
  periodCredit: number;
  closingBalance: number;
}

export const formatDateInputValue = (value: Date | null): string => {
  if (!value || Number.isNaN(value.getTime())) return '';

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatCompactMoney = (value: number): string =>
  `RD$ ${formatAccountingMoney(value)}`;

export const getVisibleLedgerMetrics = (
  entries: GeneralLedgerMovement[],
  fallbackOpeningBalance: number,
): VisibleLedgerMetrics => {
  const openingBalance =
    entries.length > 0
      ? entries[0].runningBalance - entries[0].debit + entries[0].credit
      : fallbackOpeningBalance;
  const periodDebit = entries.reduce((total, entry) => total + entry.debit, 0);
  const periodCredit = entries.reduce((total, entry) => total + entry.credit, 0);
  const closingBalance = entries.at(-1)?.runningBalance ?? openingBalance;

  return {
    openingBalance,
    periodDebit,
    periodCredit,
    closingBalance,
  };
};
