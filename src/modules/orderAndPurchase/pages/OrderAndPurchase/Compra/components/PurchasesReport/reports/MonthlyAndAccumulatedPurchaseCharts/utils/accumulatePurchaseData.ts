import { toMillis } from '@/utils/date/toMillis';

type DateInput = Date | string | number;

interface PurchaseDates {
  createdAt?: DateInput;
}

interface PurchaseData {
  dates?: PurchaseDates;
  createdAt?: DateInput;
  date?: DateInput;
  deliveryAt?: DateInput;
  paymentAt?: DateInput;
  deliveryDate?: DateInput;
  paymentDate?: DateInput;
  total?: number;
}

interface PurchaseRecord {
  data?: PurchaseData;
  createdAt?: DateInput;
  total?: number;
}

interface AccumulatedPurchaseData {
  monthlyData: Record<string, number>;
  totalAccumulated: number;
}

const toSafeNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolvePurchaseDate = (purchaseData: PurchaseData): Date | null => {
  const rawDate =
    purchaseData?.dates?.createdAt ??
    purchaseData?.createdAt ??
    purchaseData?.date ??
    purchaseData?.deliveryAt ??
    purchaseData?.paymentAt ??
    purchaseData?.deliveryDate ??
    purchaseData?.paymentDate;

  const millis = toMillis(rawDate);
  if (!Number.isFinite(millis)) {
    return null;
  }

  return new Date(millis as number);
};

export const accumulatePurchaseData = (
  purchases: ReadonlyArray<PurchaseRecord | null | undefined>,
): AccumulatedPurchaseData => {
  const monthlyData: Record<string, number> = {};
  let totalAccumulated = 0;

  for (const purchase of purchases) {
    const purchaseData = purchase?.data ?? purchase;
    if (!purchaseData) {
      continue;
    }

    const date = resolvePurchaseDate(purchaseData);
    if (!date) {
      continue;
    }

    const monthYear = date.toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    });
    const total = toSafeNumber(purchaseData.total);

    monthlyData[monthYear] = (monthlyData[monthYear] || 0) + total;
    totalAccumulated += total;
  }

  return { monthlyData, totalAccumulated };
};
