import { useCallback, useReducer } from 'react';

import type { UserListModalName, UserProfile } from '../types';

interface UserListModalState {
  activeModal: UserListModalName | null;
  selectedUser: UserProfile | null;
}

type UserListModalAction =
  | { type: 'close' }
  | { type: 'open'; modal: UserListModalName; user: UserProfile };

const initialState: UserListModalState = {
  activeModal: null,
  selectedUser: null,
};

const userListModalReducer = (
  state: UserListModalState,
  action: UserListModalAction,
): UserListModalState => {
  switch (action.type) {
    case 'open':
      return {
        activeModal: action.modal,
        selectedUser: action.user,
      };
    case 'close':
      return initialState;
    default:
      return state;
  }
};

export const useUserListModalState = ({
  canManageDynamicPermissions,
}: {
  canManageDynamicPermissions: boolean;
}) => {
  const [state, dispatch] = useReducer(userListModalReducer, initialState);

  const openPasswordModal = useCallback((user: UserProfile) => {
    dispatch({ type: 'open', modal: 'password', user });
  }, []);

  const openStatusModal = useCallback((user: UserProfile) => {
    dispatch({ type: 'open', modal: 'status', user });
  }, []);

  const openPermissionsModal = useCallback(
    (user: UserProfile) => {
      if (!canManageDynamicPermissions) return;
      dispatch({ type: 'open', modal: 'permissions', user });
    },
    [canManageDynamicPermissions],
  );

  const closeModal = useCallback(() => {
    dispatch({ type: 'close' });
  }, []);

  return {
    closeModal,
    isPasswordModalOpen: state.activeModal === 'password',
    isPermissionsModalOpen: state.activeModal === 'permissions',
    isStatusModalOpen: state.activeModal === 'status',
    openPasswordModal,
    openPermissionsModal,
    openStatusModal,
    selectedUser: state.selectedUser,
  };
};
