import { useQuery } from '@tanstack/react-query';
import { Modal, message } from 'antd';
import { useCallback, useMemo, useReducer } from 'react';

import type { GeneratedPins } from '@/firebase/authorization/pinAuth';
import {
  fbDeactivateUserPin,
  fbGenerateUserPin,
  fbGetUsersWithPinStatus,
} from '@/firebase/authorization/pinAuth';
import type { UserIdentity } from '@/types/users';

import type { AuthorizationModuleValue, PinUserRecord } from '../types';

type ModalState = 'none' | 'generate' | 'details';

interface PinManagerUiState {
  activeModal: ModalState;
  generatedPin: GeneratedPins | null;
  loading: boolean;
  selectedUserId: string | null;
}

type PinManagerUiAction =
  | { type: 'closeAll' }
  | { type: 'finishLoading' }
  | { type: 'openGenerate'; userId: string }
  | { type: 'showDetails'; generatedPin: GeneratedPins; userId: string }
  | { type: 'startLoading' };

const initialUiState: PinManagerUiState = {
  activeModal: 'none',
  generatedPin: null,
  loading: false,
  selectedUserId: null,
};

const pinManagerUiReducer = (
  state: PinManagerUiState,
  action: PinManagerUiAction,
): PinManagerUiState => {
  switch (action.type) {
    case 'startLoading':
      return {
        ...state,
        loading: true,
      };
    case 'finishLoading':
      return {
        ...state,
        loading: false,
      };
    case 'openGenerate':
      return {
        ...state,
        activeModal: 'generate',
        generatedPin: null,
        selectedUserId: action.userId,
      };
    case 'showDetails':
      return {
        ...state,
        activeModal: 'details',
        generatedPin: action.generatedPin,
        selectedUserId: action.userId,
      };
    case 'closeAll':
      return initialUiState;
    default:
      return state;
  }
};

const toErrorMessage = (error: unknown, fallback: string) => {
  return error instanceof Error ? error.message : fallback;
};

interface UseAuthorizationPinManagerArgs {
  allowed: boolean;
  user: UserIdentity | null | undefined;
}

const EMPTY_USERS: PinUserRecord[] = [];

export const useAuthorizationPinManager = ({
  allowed,
  user,
}: UseAuthorizationPinManagerArgs) => {
  const [uiState, dispatch] = useReducer(pinManagerUiReducer, initialUiState);

  const actorId = user?.uid ?? user?.id ?? null;
  const businessId = user?.businessID ?? null;
  const usersQuery = useQuery<PinUserRecord[]>({
    queryKey: ['authorizationPinUsers', businessId, actorId],
    queryFn: async () => {
      return (await fbGetUsersWithPinStatus(user)) as PinUserRecord[];
    },
    enabled: Boolean(allowed && businessId && actorId),
    staleTime: 15000,
    gcTime: 300000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
  const users = usersQuery.data ?? EMPTY_USERS;

  const loadUsers = useCallback(async () => {
    if (!allowed) return;

    try {
      await usersQuery.refetch();
    } catch (error: unknown) {
      message.error(toErrorMessage(error, 'Error cargando usuarios'));
      console.error(error);
    }
  }, [allowed, usersQuery]);

  const openGenerateModal = useCallback((userRecord: PinUserRecord) => {
    dispatch({ type: 'openGenerate', userId: userRecord.id });
  }, []);

  const closeGenerateModal = useCallback(() => {
    dispatch({ type: 'closeAll' });
  }, []);

  const closeDetailsModal = useCallback(() => {
    dispatch({ type: 'closeAll' });
  }, []);

  const selectedUser = useMemo(() => {
    if (!uiState.selectedUserId) {
      return null;
    }

    return (
      users.find((userRecord) => userRecord.id === uiState.selectedUserId) ??
      null
    );
  }, [uiState.selectedUserId, users]);

  const handleConfirmGenerate = useCallback(
    async (modules: AuthorizationModuleValue[]) => {
      if (!uiState.selectedUserId) return;

      dispatch({ type: 'startLoading' });
      try {
        const result = await fbGenerateUserPin(
          user,
          uiState.selectedUserId,
          modules,
        );
        await usersQuery.refetch();
        dispatch({
          type: 'showDetails',
          generatedPin: result,
          userId: uiState.selectedUserId,
        });
        message.success('PIN generado exitosamente');
      } catch (error: unknown) {
        message.error(toErrorMessage(error, 'Error generando PIN'));
        console.error(error);
      }
      dispatch({ type: 'finishLoading' });
    },
    [uiState.selectedUserId, user, usersQuery],
  );

  const handleDeactivatePin = useCallback(
    (userId: string, userName: string) => {
      Modal.confirm({
        title: '¿Desactivar PIN?',
        content: `¿Está seguro de desactivar el PIN del usuario ${userName}? Esta acción no se puede deshacer.`,
        okText: 'Desactivar',
        okType: 'danger',
        cancelText: 'Cancelar',
        onOk: async () => {
          dispatch({ type: 'startLoading' });
          try {
            await fbDeactivateUserPin(user, userId);
            await usersQuery.refetch();
            message.success('PIN desactivado exitosamente');
          } catch (error: unknown) {
            message.error(toErrorMessage(error, 'Error desactivando PIN'));
            console.error(error);
          }
          dispatch({ type: 'finishLoading' });
        },
      });
    },
    [user, usersQuery],
  );

  return {
    closeDetailsModal,
    closeGenerateModal,
    generatedPin: uiState.generatedPin,
    handleConfirmGenerate,
    handleDeactivatePin,
    isDetailsModalVisible: uiState.activeModal === 'details',
    isGenerateModalVisible: uiState.activeModal === 'generate',
    loading: uiState.loading || usersQuery.isLoading || usersQuery.isFetching,
    loadUsers,
    openGenerateModal,
    selectedUser,
    users,
  };
};
