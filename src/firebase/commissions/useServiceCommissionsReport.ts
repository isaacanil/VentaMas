import {
  Timestamp,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { ServiceCommissionRecord } from '@/domain/commissions/types';

interface UseServiceCommissionsReportArgs {
  businessId?: string | null;
  collaboratorId?: string | null;
  endDate: Date;
  startDate: Date;
}

interface ServiceCommissionsReportState {
  error: Error | null;
  loading: boolean;
  rows: ServiceCommissionRecord[];
}

interface InternalServiceCommissionsReportState
  extends ServiceCommissionsReportState {
  key: string;
}

const toEndOfDay = (date: Date): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(23, 59, 59, 999);
  return nextDate;
};

const toStartOfDay = (date: Date): Date => {
  const nextDate = new Date(date);
  nextDate.setHours(0, 0, 0, 0);
  return nextDate;
};

export const useServiceCommissionsReport = ({
  businessId,
  collaboratorId,
  endDate,
  startDate,
}: UseServiceCommissionsReportArgs): ServiceCommissionsReportState => {
  const [state, setState] = useState<InternalServiceCommissionsReportState>({
    key: '',
    rows: [],
    loading: false,
    error: null,
  });

  const queryBounds = useMemo(
    () => ({
      start: Timestamp.fromDate(toStartOfDay(startDate)),
      end: Timestamp.fromDate(toEndOfDay(endDate)),
    }),
    [endDate, startDate],
  );
  const reportKey = useMemo(
    () =>
      [
        businessId ?? 'no-business',
        collaboratorId ?? 'all',
        queryBounds.start.toMillis(),
        queryBounds.end.toMillis(),
      ].join('|'),
    [businessId, collaboratorId, queryBounds.end, queryBounds.start],
  );

  useEffect(() => {
    if (!businessId) {
      return undefined;
    }

    const commissionsRef = collection(
      db,
      'businesses',
      businessId,
      'serviceCommissions',
    );
    const commissionsQuery = query(
      commissionsRef,
      where('date', '>=', queryBounds.start),
      where('date', '<=', queryBounds.end),
      orderBy('date', 'desc'),
    );

    return onSnapshot(
      commissionsQuery,
      (snapshot) => {
        const rows = snapshot.docs
          .map(
            (docSnapshot) =>
              ({
                id: docSnapshot.id,
                ...docSnapshot.data(),
              }) as ServiceCommissionRecord,
          )
          .filter((row) => row.status !== 'voided')
          .filter((row) => {
            if (!collaboratorId) return true;
            return (
              row.collaboratorId === collaboratorId ||
              row.collaborator?.id === collaboratorId ||
              row.collaboratorCode === collaboratorId ||
              row.collaborator?.code === collaboratorId
            );
          }) as ServiceCommissionRecord[];

        setState({ key: reportKey, rows, loading: false, error: null });
      },
      (error) => {
        setState({ key: reportKey, rows: [], loading: false, error });
      },
    );
  }, [
    businessId,
    collaboratorId,
    queryBounds.end,
    queryBounds.start,
    reportKey,
  ]);

  if (!businessId) {
    return { rows: [], loading: false, error: null };
  }

  if (state.key !== reportKey) {
    return { rows: [], loading: true, error: null };
  }

  return state;
};

export default useServiceCommissionsReport;
