import { useEffect, useReducer } from 'react';

import { listenToAuthorizationsByStatus } from '@/firebase/authorizations/invoiceEditAuthorizations';

import type { AuthorizationRequest } from '../utils/authorizationsPanel';
import { sortAuthorizations } from '../utils/authorizationsPanel';

type PendingAuthorizationsState = {
  authorizations: AuthorizationRequest[];
  loading: boolean;
};

type PendingAuthorizationsAction =
  | {
      type: 'received';
      value: AuthorizationRequest[];
    }
  | {
      type: 'failed';
    };

const initialState: PendingAuthorizationsState = {
  authorizations: [],
  loading: true,
};

const pendingAuthorizationsReducer = (
  state: PendingAuthorizationsState,
  action: PendingAuthorizationsAction,
): PendingAuthorizationsState => {
  switch (action.type) {
    case 'received':
      return {
        authorizations: action.value,
        loading: false,
      };
    case 'failed':
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

export const usePendingAuthorizations = ({
  businessID,
  isAdmin,
  userId,
}: {
  businessID: string | undefined;
  isAdmin: boolean;
  userId: string | undefined;
}) => {
  const [state, dispatch] = useReducer(
    pendingAuthorizationsReducer,
    initialState,
  );

  useEffect(() => {
    if (!businessID) return;

    const status: any = 'pending';
    const scopedUserId = isAdmin ? null : userId;
    const unsubscribe = listenToAuthorizationsByStatus(
      businessID,
      status,
      scopedUserId,
      (data: any) => {
        dispatch({
          type: 'received',
          value: sortAuthorizations(data as AuthorizationRequest[]),
        });
      },
      (error: any) => {
        console.error('Error escuchando autorizaciones:', error);
        dispatch({ type: 'failed' });
      },
    );

    return () => unsubscribe?.();
  }, [businessID, isAdmin, userId]);

  return state;
};
