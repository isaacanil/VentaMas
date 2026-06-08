import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

import {
  normalizeMonthlyComplianceRun,
  type MonthlyComplianceRun,
} from '../utils/monthlyCompliance';

interface UseMonthlyComplianceRunsArgs {
  businessId: string | null;
  enabled: boolean;
  periodKey: string | null;
}

interface MonthlyComplianceRunsState {
  businessId: string | null;
  error: string | null;
  loading: boolean;
  periodKey: string | null;
  periodKeys: string[];
  runs: MonthlyComplianceRun[];
}

const initialState: MonthlyComplianceRunsState = {
  businessId: null,
  error: null,
  loading: false,
  periodKey: null,
  periodKeys: [],
  runs: [],
};

const sortRunsByRecency = (runs: MonthlyComplianceRun[]) =>
  [...runs].sort((left, right) => {
    const leftTime = left.createdAt?.getTime() ?? 0;
    const rightTime = right.createdAt?.getTime() ?? 0;
    if (leftTime !== rightTime) return rightTime - leftTime;
    return right.version - left.version;
  });

const normalizePeriodKey = (value: unknown) =>
  typeof value === 'string' && value.trim().length ? value.trim() : null;

export const useMonthlyComplianceRuns = ({
  businessId,
  enabled,
  periodKey,
}: UseMonthlyComplianceRunsArgs) => {
  const [state, setState] = useState<MonthlyComplianceRunsState>(initialState);
  const normalizedPeriodKey = normalizePeriodKey(periodKey);

  useEffect(() => {
    if (!enabled || !businessId || !normalizedPeriodKey) {
      return undefined;
    }

    const runsRef = collection(db, 'businesses', businessId, 'taxReportRuns');
    const runsQuery = query(
      runsRef,
      where('periodKey', '==', normalizedPeriodKey),
      limit(50),
    );

    const unsubscribe = onSnapshot(
      runsQuery,
      (snapshot) => {
        setState((currentValue) => ({
          ...currentValue,
          businessId,
          error: null,
          loading: false,
          periodKey: normalizedPeriodKey,
          runs: sortRunsByRecency(
            snapshot.docs.map((docSnap) =>
              normalizeMonthlyComplianceRun(docSnap.id, docSnap.data()),
            ),
          ),
        }));
      },
      (error) => {
        console.error('Error cargando corridas de compliance mensual:', error);
        setState((currentValue) => ({
          ...currentValue,
          businessId,
          error: 'No se pudieron cargar las corridas mensuales.',
          loading: false,
          periodKey: normalizedPeriodKey,
          runs: [],
        }));
      },
    );

    return unsubscribe;
  }, [businessId, enabled, normalizedPeriodKey]);

  useEffect(() => {
    if (!enabled || !businessId) {
      return undefined;
    }

    const versionsRef = collection(
      db,
      'businesses',
      businessId,
      'taxReportRunVersions',
    );
    const versionsQuery = query(
      versionsRef,
      orderBy('updatedAt', 'desc'),
      limit(180),
    );

    const unsubscribe = onSnapshot(
      versionsQuery,
      (snapshot) => {
        const periodKeys = Array.from(
          new Set(
            snapshot.docs
              .map((docSnap) => normalizePeriodKey(docSnap.data()?.periodKey))
              .filter((value): value is string => value !== null),
          ),
        );

        setState((currentValue) => ({
          ...currentValue,
          businessId,
          periodKeys,
        }));
      },
      (error) => {
        console.error(
          'Error cargando periodos de compliance mensual:',
          error,
        );
      },
    );

    return unsubscribe;
  }, [businessId, enabled]);

  if (!enabled || !businessId || !normalizedPeriodKey) {
    return {
      error: null,
      loading: false,
      periodKeys: [],
      runs: [],
    };
  }

  if (state.businessId !== businessId || state.periodKey !== normalizedPeriodKey) {
    return {
      error: null,
      loading: true,
      periodKeys: state.periodKeys,
      runs: [],
    };
  }

  return {
    error: state.error,
    loading: state.loading,
    periodKeys: state.periodKeys,
    runs: state.runs,
  };
};
