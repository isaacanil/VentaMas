import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

export type UserActivityType =
  | 'product'
  | 'sale'
  | 'purchase'
  | 'expense'
  | 'ar';

export interface UserActivityItem {
  id: string;
  type: UserActivityType;
  action: string;
  details: string;
  timestamp: Date;
  raw: Record<string, unknown>;
}

export interface UserActivityStats {
  radar: {
    sales: number;
    products: number;
    purchases: number;
    expenses: number;
    ar: number;
  };
  heatmap: Record<string, number>;
}

interface UseUserRealActivityParams {
  userId: string | null;
  businessId?: string | null;
}

interface UseUserRealActivityResult {
  activities: UserActivityItem[];
  stats: UserActivityStats;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

const toDateSafe = (value: unknown): Date => {
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate?: () => Date }).toDate === 'function'
  ) {
    return (value as { toDate: () => Date }).toDate();
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return new Date(value);
  }
  return new Date();
};

const toNumberSafe = (value: unknown): number => {
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useUserRealActivity = ({
  userId,
  businessId,
}: UseUserRealActivityParams): UseUserRealActivityResult => {
  const [activities, setActivities] = useState<UserActivityItem[]>([]);
  const [stats, setStats] = useState<UserActivityStats>({
    radar: {
      sales: 0,
      products: 0,
      purchases: 0,
      expenses: 0,
      ar: 0,
    },
    heatmap: {}, // { "day-hour": count }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActivity = useCallback(async () => {
    if (!userId || !businessId) return;

    setLoading(true);
    setError(null);

    try {
      // Products Query
      const productsQuery = query(
        collection(db, 'businesses', businessId, 'products'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100),
      );

      // Sales Query
      const salesQuery = query(
        collection(db, 'businesses', businessId, 'sales'),
        where('audit.createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100),
      );

      // Purchases Query
      const purchasesQuery = query(
        collection(db, 'businesses', businessId, 'purchases'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100),
      );

      // Expenses Query
      const expensesQuery = query(
        collection(db, 'businesses', businessId, 'expenses'),
        where('expense.createdBy', '==', userId),
        orderBy('expense.dates.createdAt', 'desc'),
        limit(100),
      );

      // Accounts Receivable Query
      const arQuery = query(
        collection(db, 'businesses', businessId, 'accountsReceivable'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(100),
      );

      const [
        productsResult,
        salesResult,
        purchasesResult,
        expensesResult,
        arResult,
      ] = await Promise.allSettled([
        getDocs(productsQuery),
        getDocs(salesQuery),
        getDocs(purchasesQuery),
        getDocs(expensesQuery),
        getDocs(arQuery),
      ]);

      const newActivities: UserActivityItem[] = [];

      // Process Products
      if (productsResult.status === 'fulfilled') {
        productsResult.value.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const timestamp = toDateSafe(data.createdAt);

          newActivities.push({
            id: doc.id,
            type: 'product',
            action: 'created',
            details: `Producto creado: ${data.name || 'Sin nombre'}`,
            timestamp,
            raw: data,
          });
        });
      }

      // Process Sales
      if (salesResult.status === 'fulfilled') {
        salesResult.value.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const timestamp = toDateSafe(data.createdAt);
          const totalAmount = toNumberSafe(data.totalAmount);
          const currency =
            typeof data.currency === 'string' ? data.currency : 'USD';

          newActivities.push({
            id: doc.id,
            type: 'sale',
            action: 'created',
            details: `Venta registrada: ${totalAmount} ${currency}`,
            timestamp,
            raw: data,
          });
        });
      }

      // Process Purchases
      if (purchasesResult.status === 'fulfilled') {
        purchasesResult.value.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const timestamp = toDateSafe(data.createdAt);
          const total = toNumberSafe(data.total);

          newActivities.push({
            id: doc.id,
            type: 'purchase',
            action: 'created',
            details: `Compra registrada: ${total}`,
            timestamp,
            raw: data,
          });
        });
      }

      // Process Expenses
      if (expensesResult.status === 'fulfilled') {
        expensesResult.value.forEach((doc) => {
          const rootData = doc.data() as Record<string, unknown>;
          const data =
            (rootData.expense as Record<string, unknown> | undefined) ??
            rootData;
          const dates = data.dates as Record<string, unknown> | undefined;
          const timestamp = dates?.createdAt
            ? toDateSafe(dates.createdAt)
            : new Date();
          const amount = toNumberSafe(data.amount);
          const category =
            typeof data.category === 'string' ? data.category : 'Sin categoría';

          newActivities.push({
            id: doc.id,
            type: 'expense',
            action: 'created',
            details: `Gasto registrado: ${amount} (${category})`,
            timestamp,
            raw: data,
          });
        });
      }

      // Process Accounts Receivable
      if (arResult.status === 'fulfilled') {
        arResult.value.forEach((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const timestamp = toDateSafe(data.createdAt);
          const totalReceivable = toNumberSafe(data.totalReceivable);

          newActivities.push({
            id: doc.id,
            type: 'ar',
            action: 'created',
            details: `Cuenta por cobrar: ${totalReceivable}`,
            timestamp,
            raw: data,
          });
        });
      }

      // Sort combined results
      newActivities.sort(
        (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
      );

      // Calculate Stats
      const radar: UserActivityStats['radar'] = {
        sales: 0,
        products: 0,
        purchases: 0,
        expenses: 0,
        ar: 0,
      };
      const heatmap: UserActivityStats['heatmap'] = {};

      newActivities.forEach((item) => {
        // Radar Stats
        if (item.type === 'sale') radar.sales++;
        if (item.type === 'product') radar.products++;
        if (item.type === 'purchase') radar.purchases++;
        if (item.type === 'expense') radar.expenses++;
        if (item.type === 'ar') radar.ar++;

        // Heatmap Stats
        const date = new Date(item.timestamp);
        const day = date.getDay(); // 0-6 (Sun-Sat)
        const hour = date.getHours(); // 0-23
        const key = `${day}-${hour}`;
        heatmap[key] = (heatmap[key] || 0) + 1;
      });

      setStats({ radar, heatmap });
      setActivities(newActivities);
    } catch (err) {
      console.error('Error in useUserRealActivity:', err);
      setError('Error al cargar la actividad reciente.');
    } finally {
      setLoading(false);
    }
  }, [userId, businessId]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  return { activities, stats, error, loading, refetch: fetchActivity };
};
