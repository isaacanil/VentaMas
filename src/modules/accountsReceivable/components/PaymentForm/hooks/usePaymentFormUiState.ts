import { useCallback, useReducer } from 'react';

import type {
  AutoCompleteTarget,
  ProcessedPaymentReceipt,
} from '../utils/paymentFormTypes';

interface PaymentFormUiState {
  loading: boolean;
  submitted: boolean;
  receipt: ProcessedPaymentReceipt | null;
  printPending: boolean;
  pendingAutoCompleteFlow: boolean;
  pendingAutoCompleteTarget: AutoCompleteTarget | null;
  taxReceiptModalRequested: boolean;
}

type PaymentFormUiAction =
  | { type: 'setLoading'; value: boolean }
  | { type: 'setSubmitted'; value: boolean }
  | { type: 'setReceipt'; value: ProcessedPaymentReceipt | null }
  | { type: 'setPrintPending'; value: boolean }
  | { type: 'setPendingAutoCompleteFlow'; value: boolean }
  | { type: 'setPendingAutoCompleteTarget'; value: AutoCompleteTarget | null }
  | { type: 'setTaxReceiptModalRequested'; value: boolean }
  | { type: 'resetModalFlow' };

const initialState: PaymentFormUiState = {
  loading: false,
  submitted: false,
  receipt: null,
  printPending: false,
  pendingAutoCompleteFlow: false,
  pendingAutoCompleteTarget: null,
  taxReceiptModalRequested: false,
};

const paymentFormUiReducer = (
  state: PaymentFormUiState,
  action: PaymentFormUiAction,
): PaymentFormUiState => {
  switch (action.type) {
    case 'setLoading':
      return {
        ...state,
        loading: action.value,
      };
    case 'setSubmitted':
      return {
        ...state,
        submitted: action.value,
      };
    case 'setReceipt':
      return {
        ...state,
        receipt: action.value,
      };
    case 'setPrintPending':
      return {
        ...state,
        printPending: action.value,
      };
    case 'setPendingAutoCompleteFlow':
      return {
        ...state,
        pendingAutoCompleteFlow: action.value,
      };
    case 'setPendingAutoCompleteTarget':
      return {
        ...state,
        pendingAutoCompleteTarget: action.value,
      };
    case 'setTaxReceiptModalRequested':
      return {
        ...state,
        taxReceiptModalRequested: action.value,
      };
    case 'resetModalFlow':
      return {
        ...state,
        submitted: false,
        printPending: false,
        pendingAutoCompleteFlow: false,
        pendingAutoCompleteTarget: null,
        taxReceiptModalRequested: false,
      };
    default:
      return state;
  }
};

export const usePaymentFormUiState = () => {
  const [state, dispatch] = useReducer(paymentFormUiReducer, initialState);

  const setLoading = useCallback((value: boolean) => {
    dispatch({ type: 'setLoading', value });
  }, []);

  const setSubmitted = useCallback((value: boolean) => {
    dispatch({ type: 'setSubmitted', value });
  }, []);

  const setReceipt = useCallback((value: ProcessedPaymentReceipt | null) => {
    dispatch({ type: 'setReceipt', value });
  }, []);

  const setPrintPending = useCallback((value: boolean) => {
    dispatch({ type: 'setPrintPending', value });
  }, []);

  const setPendingAutoCompleteFlow = useCallback((value: boolean) => {
    dispatch({ type: 'setPendingAutoCompleteFlow', value });
  }, []);

  const setPendingAutoCompleteTarget = useCallback(
    (value: AutoCompleteTarget | null) => {
      dispatch({ type: 'setPendingAutoCompleteTarget', value });
    },
    [],
  );

  const setTaxReceiptModalRequested = useCallback((value: boolean) => {
    dispatch({ type: 'setTaxReceiptModalRequested', value });
  }, []);

  const resetModalFlow = useCallback(() => {
    dispatch({ type: 'resetModalFlow' });
  }, []);

  return {
    ...state,
    resetModalFlow,
    setLoading,
    setPendingAutoCompleteFlow,
    setPendingAutoCompleteTarget,
    setPrintPending,
    setReceipt,
    setSubmitted,
    setTaxReceiptModalRequested,
  };
};
