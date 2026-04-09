import { useCallback, useDeferredValue, useReducer } from 'react';

import type { BusinessFilters, BusinessInfo } from '../types';
import { INITIAL_BUSINESS_FILTERS } from '../utils/businessControl';

interface BusinessControlUiState {
  currentPage: number;
  editModalOpen: boolean;
  filters: BusinessFilters;
  filtersVisible: boolean;
  searchTerm: string;
  selectedBusiness: BusinessInfo | null;
}

type BusinessControlUiAction =
  | { type: 'closeEditModal' }
  | { type: 'closeFiltersDrawer' }
  | { type: 'goToNextPage'; totalPages: number }
  | { type: 'goToPrevPage' }
  | { type: 'openEditModal'; business: BusinessInfo }
  | { type: 'resetFilters' }
  | { type: 'setFilter'; key: keyof BusinessFilters; value: BusinessFilters[keyof BusinessFilters] }
  | { type: 'setSearchTerm'; value: string }
  | { type: 'showFiltersDrawer' };

const initialState: BusinessControlUiState = {
  currentPage: 1,
  editModalOpen: false,
  filters: INITIAL_BUSINESS_FILTERS,
  filtersVisible: false,
  searchTerm: '',
  selectedBusiness: null,
};

const businessControlUiReducer = (
  state: BusinessControlUiState,
  action: BusinessControlUiAction,
): BusinessControlUiState => {
  switch (action.type) {
    case 'setSearchTerm':
      return {
        ...state,
        searchTerm: action.value,
      };
    case 'setFilter':
      return {
        ...state,
        currentPage: 1,
        filters: {
          ...state.filters,
          [action.key]: action.value,
        },
      };
    case 'resetFilters':
      return {
        ...state,
        currentPage: 1,
        filters: INITIAL_BUSINESS_FILTERS,
      };
    case 'showFiltersDrawer':
      return {
        ...state,
        filtersVisible: true,
      };
    case 'closeFiltersDrawer':
      return {
        ...state,
        filtersVisible: false,
      };
    case 'goToPrevPage':
      return {
        ...state,
        currentPage: Math.max(1, state.currentPage - 1),
      };
    case 'goToNextPage':
      return {
        ...state,
        currentPage: Math.min(action.totalPages, state.currentPage + 1),
      };
    case 'openEditModal':
      return {
        ...state,
        editModalOpen: true,
        selectedBusiness: action.business,
      };
    case 'closeEditModal':
      return {
        ...state,
        editModalOpen: false,
        selectedBusiness: null,
      };
    default:
      return state;
  }
};

export const useBusinessControlUiState = () => {
  const [state, dispatch] = useReducer(businessControlUiReducer, initialState);
  const debouncedSearchTerm = useDeferredValue(state.searchTerm);

  const setSearchTerm = useCallback((value: string) => {
    dispatch({
      type: 'setSearchTerm',
      value,
    });
  }, []);

  const handleFilterChange = useCallback(
    (
      filterName: keyof BusinessFilters,
      value: BusinessFilters[keyof BusinessFilters],
    ) => {
      dispatch({
        type: 'setFilter',
        key: filterName,
        value,
      });
    },
    [],
  );

  const resetFilters = useCallback(() => {
    dispatch({ type: 'resetFilters' });
  }, []);

  const showFiltersDrawer = useCallback(() => {
    dispatch({ type: 'showFiltersDrawer' });
  }, []);

  const closeFiltersDrawer = useCallback(() => {
    dispatch({ type: 'closeFiltersDrawer' });
  }, []);

  const goToPrevPage = useCallback(() => {
    dispatch({ type: 'goToPrevPage' });
  }, []);

  const goToNextPage = useCallback((totalPages: number) => {
    dispatch({
      type: 'goToNextPage',
      totalPages,
    });
  }, []);

  const handleEditBusiness = useCallback((business: BusinessInfo) => {
    dispatch({
      type: 'openEditModal',
      business,
    });
  }, []);

  const handleCloseModal = useCallback(() => {
    dispatch({ type: 'closeEditModal' });
  }, []);

  return {
    closeFiltersDrawer,
    currentPage: state.currentPage,
    debouncedSearchTerm,
    editModalOpen: state.editModalOpen,
    filters: state.filters,
    filtersVisible: state.filtersVisible,
    goToNextPage,
    goToPrevPage,
    handleCloseModal,
    handleEditBusiness,
    handleFilterChange,
    resetFilters,
    searchTerm: state.searchTerm,
    selectedBusiness: state.selectedBusiness,
    setSearchTerm,
    showFiltersDrawer,
  };
};
