import { message } from 'antd';
import { useCallback, useEffect, useReducer } from 'react';

import {
  fbDeactivateUserPin,
  fbGenerateUserPin,
  fbGetUserPinStatus,
  type GeneratedPins,
  type PinStatus,
} from '@/firebase/authorization/pinAuth';
import type { UserIdentity } from '@/types/users';

type AuthUser = UserIdentity & { uid?: string; displayName?: string };

type SelectedModule = {
  key: string;
  label: string;
};

type PersonalPinControllerState = {
  pinStatus: PinStatus;
  loading: boolean;
  requestModalVisible: boolean;
  generateModalVisible: boolean;
  detailsModalVisible: boolean;
  generatedPin: GeneratedPins | null;
  infoModalVisible: boolean;
  viewPinModalVisible: boolean;
  selectedModule: SelectedModule | null;
};

type PersonalPinControllerAction =
  | { type: 'setLoading'; value: boolean }
  | { type: 'setPinStatus'; value: PinStatus }
  | {
      type:
        | 'openRequestModal'
        | 'closeRequestModal'
        | 'openGenerateModal'
        | 'closeGenerateModal'
        | 'openInfoModal'
        | 'closeInfoModal';
    }
  | { type: 'pinGenerated'; value: GeneratedPins }
  | { type: 'closeDetailsModal' }
  | { type: 'openViewPinModal'; value: SelectedModule }
  | { type: 'closeViewPinModal' };

const DEFAULT_PIN_STATUS: PinStatus = {
  hasPin: false,
  isActive: false,
  isExpired: false,
  modules: [],
  activeModules: [],
  createdAt: null,
  expiresAt: null,
  updatedAt: null,
  moduleDetails: {},
  schema: 'v2',
  createdBy: null,
  targetUser: null,
};

const initialState: PersonalPinControllerState = {
  pinStatus: DEFAULT_PIN_STATUS,
  loading: false,
  requestModalVisible: false,
  generateModalVisible: false,
  detailsModalVisible: false,
  generatedPin: null,
  infoModalVisible: false,
  viewPinModalVisible: false,
  selectedModule: null,
};

const personalPinControllerReducer = (
  state: PersonalPinControllerState,
  action: PersonalPinControllerAction,
): PersonalPinControllerState => {
  switch (action.type) {
    case 'setLoading':
      return {
        ...state,
        loading: action.value,
      };
    case 'setPinStatus':
      return {
        ...state,
        pinStatus: action.value,
      };
    case 'openRequestModal':
      return {
        ...state,
        requestModalVisible: true,
      };
    case 'closeRequestModal':
      return {
        ...state,
        requestModalVisible: false,
      };
    case 'openGenerateModal':
      return {
        ...state,
        generateModalVisible: true,
      };
    case 'closeGenerateModal':
      return {
        ...state,
        generateModalVisible: false,
      };
    case 'openInfoModal':
      return {
        ...state,
        infoModalVisible: true,
      };
    case 'closeInfoModal':
      return {
        ...state,
        infoModalVisible: false,
      };
    case 'pinGenerated':
      return {
        ...state,
        generatedPin: action.value,
        generateModalVisible: false,
        detailsModalVisible: true,
      };
    case 'closeDetailsModal':
      return {
        ...state,
        detailsModalVisible: false,
        generatedPin: null,
      };
    case 'openViewPinModal':
      return {
        ...state,
        selectedModule: action.value,
        viewPinModalVisible: true,
      };
    case 'closeViewPinModal':
      return {
        ...state,
        viewPinModalVisible: false,
        selectedModule: null,
      };
    default:
      return state;
  }
};

const resolveSelfUserId = (user: AuthUser | null) =>
  user?.uid || user?.id || null;

export const usePersonalPinController = (user: AuthUser | null) => {
  const [state, dispatch] = useReducer(
    personalPinControllerReducer,
    initialState,
  );
  const selfUserId = resolveSelfUserId(user);

  const fetchPinStatus = useCallback(async () => {
    if (!user || !selfUserId) {
      return DEFAULT_PIN_STATUS;
    }

    try {
      return await fbGetUserPinStatus(user, selfUserId);
    } catch {
      return DEFAULT_PIN_STATUS;
    }
  }, [selfUserId, user]);

  const loadPinStatus = useCallback(async () => {
    if (!user || !selfUserId) return;

    dispatch({ type: 'setLoading', value: true });
    const nextStatus = await fetchPinStatus();
    dispatch({ type: 'setPinStatus', value: nextStatus });
    dispatch({ type: 'setLoading', value: false });
  }, [fetchPinStatus, selfUserId, user]);

  useEffect(() => {
    if (!selfUserId) return;
    void loadPinStatus();
  }, [loadPinStatus, selfUserId]);

  const handleGeneratePin = useCallback(
    async (modules: string[]) => {
      if (!user || !selfUserId) {
        message.error('Sesión inválida. Inicia sesión nuevamente.');
        return;
      }

      dispatch({ type: 'setLoading', value: true });

      let generatedPin: GeneratedPins | null = null;
      try {
        generatedPin = await fbGenerateUserPin(user, selfUserId, modules);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Error generando PIN';
        message.error(errorMessage);
        console.error(error);
      }

      if (generatedPin) {
        dispatch({ type: 'pinGenerated', value: generatedPin });
        message.success('PIN generado exitosamente');
        const nextStatus = await fetchPinStatus();
        dispatch({ type: 'setPinStatus', value: nextStatus });
      }

      dispatch({ type: 'setLoading', value: false });
    },
    [fetchPinStatus, selfUserId, user],
  );

  const deactivatePin = useCallback(async () => {
    if (!user || !selfUserId) {
      message.error('Sesión inválida. Inicia sesión nuevamente.');
      return;
    }

    dispatch({ type: 'setLoading', value: true });

    let wasDeactivated = false;
    try {
      await fbDeactivateUserPin(user, selfUserId);
      wasDeactivated = true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Error desactivando PIN';
      message.error(errorMessage);
      console.error(error);
    }

    if (wasDeactivated) {
      message.success('PIN desactivado exitosamente');
      const nextStatus = await fetchPinStatus();
      dispatch({ type: 'setPinStatus', value: nextStatus });
    }

    dispatch({ type: 'setLoading', value: false });
  }, [fetchPinStatus, selfUserId, user]);

  const openRequestModal = useCallback(() => {
    dispatch({ type: 'openRequestModal' });
  }, []);

  const closeRequestModal = useCallback(() => {
    dispatch({ type: 'closeRequestModal' });
  }, []);

  const openGenerateModal = useCallback(() => {
    dispatch({ type: 'openGenerateModal' });
  }, []);

  const closeGenerateModal = useCallback(() => {
    dispatch({ type: 'closeGenerateModal' });
  }, []);

  const openInfoModal = useCallback(() => {
    dispatch({ type: 'openInfoModal' });
  }, []);

  const closeInfoModal = useCallback(() => {
    dispatch({ type: 'closeInfoModal' });
  }, []);

  const closeDetailsModal = useCallback(() => {
    dispatch({ type: 'closeDetailsModal' });
  }, []);

  const openViewPinModal = useCallback((module: SelectedModule) => {
    dispatch({ type: 'openViewPinModal', value: module });
  }, []);

  const closeViewPinModal = useCallback(() => {
    dispatch({ type: 'closeViewPinModal' });
  }, []);

  return {
    ...state,
    closeDetailsModal,
    closeGenerateModal,
    closeInfoModal,
    closeRequestModal,
    closeViewPinModal,
    deactivatePin,
    handleGeneratePin,
    loadPinStatus,
    openGenerateModal,
    openInfoModal,
    openRequestModal,
    openViewPinModal,
  };
};
