import type { PaymentWithholdingApplication } from '@/types/payments';

const MONEY_THRESHOLD = 0.01;

export interface PaymentSettlementSource {
  settlementAmount?: number | null;
  totalAmount?: number | null;
  withholdingAmount?: number | null;
  withholdingApplications?: PaymentWithholdingApplication[] | null;
}

export interface PaymentWithholdingBreakdownLine {
  amount: number;
  label: string;
  type: string;
}

export interface PaymentSettlementSummary {
  cashAmount: number;
  hasWithholdingSettlement: boolean;
  isSettlementDifferentFromCash: boolean;
  settlementAmount: number;
  withholdingAmount: number;
  withholdingBreakdown: PaymentWithholdingBreakdownLine[];
}

const roundMoney = (value: number): number => Math.round(value * 100) / 100;

const toOptionalMoney = (value: unknown): number | null => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return roundMoney(Math.max(parsed, 0));
};

const toMoney = (value: unknown): number => toOptionalMoney(value) ?? 0;

const WITHHOLDING_TYPE_LABELS: Record<string, string> = {
  isr: 'Retención ISR',
  itbis: 'Retención ITBIS',
  other: 'Otras retenciones',
};

const WITHHOLDING_TYPE_PRIORITY: Record<string, number> = {
  itbis: 0,
  isr: 1,
  other: 2,
};

const normalizeWithholdingType = (value: unknown): string => {
  if (typeof value !== 'string') return 'other';
  const normalized = value.trim().toLowerCase();
  return normalized.length ? normalized : 'other';
};

const resolveWithholdingLabel = (type: string): string =>
  WITHHOLDING_TYPE_LABELS[type] ?? 'Otras retenciones';

const summarizeWithholdingApplications = (
  applications: PaymentWithholdingApplication[] | null | undefined,
): PaymentWithholdingBreakdownLine[] => {
  const summaryMap = new Map<string, PaymentWithholdingBreakdownLine>();

  (Array.isArray(applications) ? applications : []).forEach((application) => {
    const amount = toMoney(application.amount);
    if (amount <= MONEY_THRESHOLD) return;

    const type = normalizeWithholdingType(application.type);
    const current = summaryMap.get(type) ?? {
      amount: 0,
      label: resolveWithholdingLabel(type),
      type,
    };

    current.amount = roundMoney(current.amount + amount);
    summaryMap.set(type, current);
  });

  return [...summaryMap.values()].sort((left, right) => {
    const priorityDelta =
      (WITHHOLDING_TYPE_PRIORITY[left.type] ?? 99) -
      (WITHHOLDING_TYPE_PRIORITY[right.type] ?? 99);

    return priorityDelta || left.label.localeCompare(right.label);
  });
};

export const resolvePaymentSettlementSummary = (
  payment: PaymentSettlementSource,
): PaymentSettlementSummary => {
  const cashAmount = toMoney(payment.totalAmount);
  const applicationBreakdown = summarizeWithholdingApplications(
    payment.withholdingApplications,
  );
  const applicationWithholdingAmount = roundMoney(
    applicationBreakdown.reduce((sum, line) => sum + line.amount, 0),
  );
  const explicitWithholdingAmount = toOptionalMoney(payment.withholdingAmount);
  const withholdingAmount = roundMoney(
    explicitWithholdingAmount ?? applicationWithholdingAmount,
  );
  const explicitSettlementAmount = toOptionalMoney(payment.settlementAmount);
  const fallbackSettlementAmount = roundMoney(cashAmount + withholdingAmount);
  const settlementAmount = roundMoney(
    explicitSettlementAmount != null && explicitSettlementAmount > MONEY_THRESHOLD
      ? explicitSettlementAmount
      : fallbackSettlementAmount,
  );
  const withholdingBreakdown = [...applicationBreakdown];
  const withholdingDifference = roundMoney(
    withholdingAmount - applicationWithholdingAmount,
  );

  if (withholdingAmount > MONEY_THRESHOLD) {
    if (withholdingBreakdown.length === 0) {
      withholdingBreakdown.push({
        amount: withholdingAmount,
        label: 'Retención fiscal',
        type: 'other',
      });
    } else if (withholdingDifference > MONEY_THRESHOLD) {
      withholdingBreakdown.push({
        amount: withholdingDifference,
        label: 'Otras retenciones',
        type: 'other',
      });
    }
  }

  return {
    cashAmount,
    hasWithholdingSettlement: withholdingAmount > MONEY_THRESHOLD,
    isSettlementDifferentFromCash:
      Math.abs(settlementAmount - cashAmount) > MONEY_THRESHOLD,
    settlementAmount,
    withholdingAmount,
    withholdingBreakdown,
  };
};
