import { message } from 'antd';
import type {
  AccountsReceivableInstallment,
  AccountsReceivableSummaryData,
} from '@/utils/accountsReceivable/types';
import type { TimestampLike } from '@/utils/date/types';
import { formatLocaleDate } from '@/utils/date/dateUtils';
import { toMillis } from '@/utils/date/toMillis';
import { toNumber } from '@/utils/number/toNumber';

export const formatCurrency = (value: unknown) => {
  const numeric = toNumber(value, NaN);
  return Number.isFinite(numeric) ? `$${numeric.toFixed(2)}` : 'N/A';
};

export const formatDate = (timestamp: TimestampLike | null | undefined) => {
  const millis = toMillis(timestamp);
  if (!millis) return 'N/A';
  return formatLocaleDate(millis, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const calculateProgress = (
  data: AccountsReceivableSummaryData | null | undefined,
) => {
  const total = toNumber(data?.ar?.totalReceivable ?? data?.ar?.totalAmount);
  const balance = toNumber(
    data?.ar?.arBalance ??
      data?.ar?.currentBalance ??
      data?.ar?.balance ??
      total,
  );

  if (total <= 0) return 0;

  const paid = total - balance;
  const percentage = (paid / total) * 100;

  return Math.min(Math.max(percentage, 0), 100);
};

export const copyToClipboard = (
  text: string | number | null | undefined,
  label: string,
) => {
  if (!text) return;
  navigator.clipboard
    .writeText(String(text))
    .then(() => {
      message.success(`${label} copiado al portapapeles`);
    })
    .catch(() => {
      message.success(`${label} copiado al portapapeles`);
    });
};

export const openWhatsApp = (
  phone: string | number | null | undefined,
  clientName = '',
) => {
  if (!phone) return;
  const cleanPhone = String(phone).replace(/\D/g, '');
  const defaultMessage = `Hola ${clientName}, le contactamos sobre su cuenta pendiente.`;
  window.open(
    `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`,
    '_blank',
  );
};

export const translateFrequency = (frequency?: string | null) => {
  const translations: Record<string, string> = {
    monthly: 'Mensual',
    weekly: 'Semanal',
    biweekly: 'Quincenal',
    daily: 'Diario',
  };
  if (!frequency) return 'N/A';
  return translations[frequency] || frequency;
};

export const getDaysLate = (nextPaymentDate?: Date | null) => {
  if (!nextPaymentDate) return 0;
  const today = new Date();
  const diffTime = today.getTime() - nextPaymentDate.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

export interface NextPaymentInfo {
  date: Date | null;
  isPaid?: boolean;
  isLate?: boolean;
  status: string;
  installmentNumber?: number | null;
  amount?: number;
}

const getInstallmentMillis = (installment: AccountsReceivableInstallment) =>
  toMillis(installment.installmentDate) ?? 0;

export const getNextPaymentInfo = (
  data?: AccountsReceivableSummaryData | null,
): NextPaymentInfo => {
  if (!data?.installments || !data?.ar) return { date: null, status: 'N/A' };

  const sortedInstallments = [...data.installments].sort(
    (a, b) => getInstallmentMillis(a) - getInstallmentMillis(b),
  );

  const nextPendingInstallment = sortedInstallments.find(
    (inst) => toNumber(inst.installmentBalance) > 0,
  );

  if (!nextPendingInstallment) {
    return {
      date: null,
      isPaid: true,
      isLate: false,
      status: 'COMPLETADO',
      installmentNumber: null,
    };
  }

  const nextPaymentDate = new Date(getInstallmentMillis(nextPendingInstallment));
  const today = new Date();
  const isLate = nextPaymentDate < today;

  return {
    date: nextPaymentDate,
    isPaid: false,
    isLate,
    status: isLate ? 'ATRASADO' : 'PENDIENTE',
    installmentNumber: nextPendingInstallment.installmentNumber,
    amount: nextPendingInstallment.installmentAmount,
  };
};
