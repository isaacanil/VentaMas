import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import { resolveBusinessFiscalRollout } from '@/utils/fiscal/fiscalRollout';

interface UseFiscalMonthlyComplianceAvailabilityArgs {
  businessId: string | null;
  enabled: boolean;
}

interface FiscalMonthlyComplianceAvailability {
  enabled: boolean;
  error: string | null;
  resolved: boolean;
}

interface SnapshotState {
  businessId: string;
  enabled: boolean;
  error: string | null;
}

const buildAvailability = (
  state: SnapshotState,
): FiscalMonthlyComplianceAvailability => ({
  enabled: state.enabled,
  error: state.error,
  resolved: true,
});

export const useFiscalMonthlyComplianceAvailability = ({
  businessId,
  enabled,
}: UseFiscalMonthlyComplianceAvailabilityArgs): FiscalMonthlyComplianceAvailability => {
  const [snapshotState, setSnapshotState] = useState<SnapshotState | null>(
    null,
  );

  useEffect(() => {
    if (!enabled || !businessId) {
      return undefined;
    }

    const businessRef = doc(db, 'businesses', businessId);

    return onSnapshot(
      businessRef,
      (snapshot) => {
        const rollout = resolveBusinessFiscalRollout(
          snapshot.exists() ? snapshot.data() : null,
        );

        setSnapshotState({
          businessId,
          enabled:
            rollout.reportingEnabled && rollout.monthlyComplianceEnabled,
          error: null,
        });
      },
      (cause) => {
        console.error(
          'Error validando piloto de compliance mensual DGII:',
          cause,
        );
        setSnapshotState({
          businessId,
          enabled: false,
          error:
            'No se pudo validar si el compliance mensual DGII esta habilitado.',
        });
      },
    );
  }, [businessId, enabled]);

  if (!enabled || !businessId) {
    return {
      enabled: false,
      error: null,
      resolved: true,
    };
  }

  if (snapshotState?.businessId === businessId) {
    return buildAvailability(snapshotState);
  }

  return {
    enabled: false,
    error: null,
    resolved: false,
  };
};
