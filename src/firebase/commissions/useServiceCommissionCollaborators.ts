import {
  collection,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';

import { db } from '@/firebase/firebaseconfig';
import type { ServiceCommissionCollaboratorRecord } from '@/types/commissions';

import { normalizeServiceCommissionCollaboratorRecord } from './useServiceCommissionCollaborators.utils';

interface ServiceCommissionCollaboratorsState {
  businessId: string | null;
  error: Error | null;
  loading: boolean;
  rows: ServiceCommissionCollaboratorRecord[];
}

const EMPTY_STATE: ServiceCommissionCollaboratorsState = {
  businessId: null,
  rows: [],
  loading: false,
  error: null,
};

export const useServiceCommissionCollaborators = (
  businessId?: string | null,
) => {
  const [state, setState] =
    useState<ServiceCommissionCollaboratorsState>(EMPTY_STATE);

  const collaboratorQuery = useMemo(() => {
    if (!businessId) return null;
    return query(
      collection(
        db,
        'businesses',
        businessId,
        'serviceCommissionCollaborators',
      ),
      orderBy('code', 'asc'),
    );
  }, [businessId]);

  useEffect(() => {
    if (!businessId || !collaboratorQuery) return undefined;

    return onSnapshot(
      collaboratorQuery,
      (snapshot) => {
        const rows = snapshot.docs.map((docSnapshot) =>
          normalizeServiceCommissionCollaboratorRecord(
            docSnapshot.id,
            docSnapshot.data() as Record<string, unknown>,
          ),
        );

        setState({
          businessId,
          rows,
          loading: false,
          error: null,
        });
      },
      (error) => {
        setState({
          businessId,
          rows: [],
          loading: false,
          error,
        });
      },
    );
  }, [businessId, collaboratorQuery]);

  if (!businessId) return EMPTY_STATE;
  if (state.businessId !== businessId) {
    return {
      businessId,
      rows: [],
      loading: true,
      error: null,
    };
  }

  return state;
};

export default useServiceCommissionCollaborators;
