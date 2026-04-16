import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';

import {
  normalizeMonthlyComplianceRun,
  type MonthlyComplianceRun,
} from '../utils/monthlyCompliance';

interface UseMonthlyComplianceRunsArgs {
  businessId: string | null;
  enabled: boolean;
}

interface MonthlyComplianceRunsState {
  businessId: string | null;
  error: string | null;
  loading: boolean;
  runs: MonthlyComplianceRun[];
}

const initialState: MonthlyComplianceRunsState = {
  businessId: null,
  error: null,
  loading: false,
  runs: [],
};

export const useMonthlyComplianceRuns = ({
  businessId,
  enabled,
}: UseMonthlyComplianceRunsArgs) => {
  const [state, setState] = useState<MonthlyComplianceRunsState>(initialState);

  useEffect(() => {
    if (!enabled || !businessId) {
      return undefined;
    }

    const runsRef = collection(db, 'businesses', businessId, 'taxReportRuns');
    const runsQuery = query(runsRef, orderBy('createdAt', 'desc'), limit(20));

    const unsubscribe = onSnapshot(
      runsQuery,
      (snapshot) => {
        setState({
          businessId,
          error: null,
          loading: false,
          runs: snapshot.docs.map((docSnap) =>
            normalizeMonthlyComplianceRun(docSnap.id, docSnap.data()),
          ),
        });
      },
      (error) => {
        console.error('Error cargando corridas de compliance mensual:', error);
        setState({
          businessId,
          error: 'No se pudieron cargar las corridas mensuales.',
          loading: false,
          runs: [],
        });
      },
    );

    return unsubscribe;
  }, [businessId, enabled]);

  if (!enabled || !businessId) {
    return {
      error: null,
      loading: false,
      runs: [],
    };
  }

  if (state.businessId !== businessId) {
    return {
      error: null,
      loading: true,
      runs: [],
    };
  }

  return {
    error: state.error,
    loading: state.loading,
    runs: state.runs,
  };
};
