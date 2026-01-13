import { Timestamp } from 'firebase/firestore';
import type { PurchaseReplenishment } from '@/utils/purchase/types';

type DefaultsMap = Record<string, unknown>;

export const sanitizeData = <T extends Record<string, unknown>>(
  data: T,
  defaultsMap: DefaultsMap = {},
): T => {
  const processField = (field: unknown, key?: string): unknown => {
    if (field === undefined || field === null) {
      return key && key in defaultsMap ? defaultsMap[key] : null;
    }
    if (typeof field === 'string' && field.trim() === '') return '';
    if (typeof field === 'number' && Number.isNaN(field)) return 0;
    if (field instanceof Date) return Timestamp.fromDate(field);
    if (typeof field === 'object' && field !== null && !Array.isArray(field)) {
      return sanitizeObject(field as Record<string, unknown>);
    }
    if (Array.isArray(field)) {
      return field.map((item) => processField(item));
    }
    return field;
  };

  const sanitizeObject = (obj: Record<string, unknown>) => {
    const sanitized: Record<string, unknown> = {};
    for (const key in obj) {
      sanitized[key] = processField(obj[key], key);
    }
    return sanitized;
  };

  return sanitizeObject(data) as T;
};

export const defaultsMap: DefaultsMap = {
  createdAt: null,
  deletedAt: null,
  completedAt: null,
  deliveryAt: null,
  paymentAt: null,

  quantity: 0,
  baseCost: 0,
  unitCost: 0,
  subTotal: 0,
  calculatedITBIS: 0,
} satisfies Partial<PurchaseReplenishment>;
