import { useCallback, useReducer } from 'react';

import type { UserFilters, UserProfile } from '../types';
import { DEFAULT_FILTERS } from '../utils/userList';

type ActiveModal = 'none' | 'password' | 'permissions' | 'status';

interface UserListUiState {
  activeModal: ActiveModal;
  filters: UserFilters;
  searchTerm: string;
  selectedUser: UserProfile | null;
}

type UserListUiAction =
  | { type: 'clearFilters' }
  | { type: 'closeModal' }
  | { type: 'openModal'; modal: ActiveModal; user: UserProfile }
  | { type: 'setFilter'; key: keyof UserFilters; value: string }
  | { type: 'setSearchTerm'; value: string };

const initialState: UserListUiState = {
  activeModal: 'none',
  filters: DEFAULT_FILTERS,
  searchTerm: '',
  selectedUser: null,
};

const userListUiReducer = (
  state: UserListUiState,
  action: UserListUiAction,
): UserListUiState => {
  switch (action.type) {
    case 'setSearchTerm':
      return {
        ...state,
        searchTerm: action.value,
      };
    case 'setFilter':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.key]: action.value,
        },
      };
    case 'clearFilters':
      return {
        ...state,
        filters: DEFAULT_FILTERS,
      };
    case 'openModal':
      return {
        ...state,
        activeModal: action.modal,
        selectedUser: action.user,
      };
    case 'closeModal':
      return {
        ...state,
        activeModal: 'none',
        selectedUser: null,
      };
    default:
      return state;
  }
};

export const useUserListUiState = () => {
  const [state, dispatch] = useReducer(userListUiReducer, initialState);

  const setSearchTerm = useCallback((value: string) => {
    dispatch({
      type: 'setSearchTerm',
      value,
    });
  }, []);

  const setFilterValue = useCallback(
    (key: keyof UserFilters) =>
      (value: string | number | null | Array<string | number>) => {
        dispatch({
          type: 'setFilter',
          key,
          value: String(value || ''),
        });
      },
    [],
  );

  const clearFilters = useCallback(() => {
    dispatch({ type: 'clearFilters' });
  }, []);

  const openPasswordModal = useCallback((user: UserProfile) => {
    dispatch({
      type: 'openModal',
      modal: 'password',
      user,
    });
  }, []);

  const openStatusModal = useCallback((user: UserProfile) => {
    dispatch({
      type: 'openModal',
      modal: 'status',
      user,
    });
  }, []);

  const openPermissionsModal = useCallback((user: UserProfile) => {
    dispatch({
      type: 'openModal',
      modal: 'permissions',
      user,
    });
  }, []);

  const closeActiveModal = useCallback(() => {
    dispatch({ type: 'closeModal' });
  }, []);

  return {
    clearFilters,
    closeActiveModal,
    filters: state.filters,
    isPasswordModalOpen: state.activeModal === 'password',
    isPermissionsModalOpen: state.activeModal === 'permissions',
    isStatusModalOpen: state.activeModal === 'status',
    openPasswordModal,
    openPermissionsModal,
    openStatusModal,
    searchTerm: state.searchTerm,
    selectedUser: state.selectedUser,
    setFilterValue,
    setSearchTerm,
  };
};
