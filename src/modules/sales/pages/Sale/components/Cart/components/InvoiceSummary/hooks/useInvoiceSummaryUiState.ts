import { useCallback, useEffect, useReducer, useRef } from 'react';

import type { InvoiceData } from '@/types/invoice';

import type { PreorderConfirmationAction } from '../types';

type CashRegisterAlertRequest = {
  status: string;
  bypassGeneration: number;
} | null;

type InvoiceSummaryUiState = {
  isOpenPreorderConfirmation: boolean;
  preorderConfirmationAction: PreorderConfirmationAction;
  isLoadingQuotation: boolean;
  isSavingPreorder: boolean;
  preorderPrintData: InvoiceData | null;
  pendingPreorderPrint: boolean;
  bypassGeneration: number;
  cashRegisterAlertRequest: CashRegisterAlertRequest;
};

type InvoiceSummaryUiAction =
  | {
      type: 'open-preorder-confirmation';
      action: PreorderConfirmationAction;
    }
  | {
      type: 'close-preorder-confirmation';
    }
  | {
      type: 'set-quotation-loading';
      value: boolean;
    }
  | {
      type: 'set-preorder-saving';
      value: boolean;
    }
  | {
      type: 'set-preorder-print-data';
      data: InvoiceData | null;
    }
  | {
      type: 'set-pending-preorder-print';
      value: boolean;
    }
  | {
      type: 'request-cash-register-alert';
      request: CashRegisterAlertRequest;
    }
  | {
      type: 'clear-cash-register-alert';
    }
  | {
      type: 'increment-bypass-generation';
    };

const initialState: InvoiceSummaryUiState = {
  isOpenPreorderConfirmation: false,
  preorderConfirmationAction: 'complete',
  isLoadingQuotation: false,
  isSavingPreorder: false,
  preorderPrintData: null,
  pendingPreorderPrint: false,
  bypassGeneration: 0,
  cashRegisterAlertRequest: null,
};

function invoiceSummaryUiReducer(
  state: InvoiceSummaryUiState,
  action: InvoiceSummaryUiAction,
): InvoiceSummaryUiState {
  switch (action.type) {
    case 'open-preorder-confirmation':
      return {
        ...state,
        isOpenPreorderConfirmation: true,
        preorderConfirmationAction: action.action,
      };
    case 'close-preorder-confirmation':
      return {
        ...state,
        isOpenPreorderConfirmation: false,
      };
    case 'set-quotation-loading':
      return {
        ...state,
        isLoadingQuotation: action.value,
      };
    case 'set-preorder-saving':
      return {
        ...state,
        isSavingPreorder: action.value,
      };
    case 'set-preorder-print-data':
      return {
        ...state,
        preorderPrintData: action.data,
      };
    case 'set-pending-preorder-print':
      return {
        ...state,
        pendingPreorderPrint: action.value,
      };
    case 'request-cash-register-alert':
      return {
        ...state,
        cashRegisterAlertRequest: action.request,
      };
    case 'increment-bypass-generation':
      return {
        ...state,
        bypassGeneration: state.bypassGeneration + 1,
      };
    case 'clear-cash-register-alert':
      return {
        ...state,
        cashRegisterAlertRequest: null,
      };
    default:
      return state;
  }
}

export function useInvoiceSummaryUiState(cashRegisterAlertBypass: boolean) {
  const [state, dispatch] = useReducer(invoiceSummaryUiReducer, initialState);
  const previousBypassRef = useRef(cashRegisterAlertBypass);

  useEffect(() => {
    if (previousBypassRef.current === cashRegisterAlertBypass) return;
    previousBypassRef.current = cashRegisterAlertBypass;
    dispatch({ type: 'increment-bypass-generation' });
  }, [cashRegisterAlertBypass]);

  const openPreorderConfirmation = useCallback(
    (action: PreorderConfirmationAction) => {
      dispatch({ type: 'open-preorder-confirmation', action });
    },
    [],
  );

  const closePreorderConfirmation = useCallback(() => {
    dispatch({ type: 'close-preorder-confirmation' });
  }, []);

  const setQuotationLoading = useCallback((value: boolean) => {
    dispatch({ type: 'set-quotation-loading', value });
  }, []);

  const setPreorderSaving = useCallback((value: boolean) => {
    dispatch({ type: 'set-preorder-saving', value });
  }, []);

  const setPreorderPrintData = useCallback((data: InvoiceData | null) => {
    dispatch({ type: 'set-preorder-print-data', data });
  }, []);

  const setPendingPreorderPrint = useCallback((value: boolean) => {
    dispatch({ type: 'set-pending-preorder-print', value });
  }, []);

  const requestCashRegisterAlert = useCallback((status: string) => {
    dispatch({
      type: 'request-cash-register-alert',
      request: {
        status,
        bypassGeneration: state.bypassGeneration,
      },
    });
  }, [state.bypassGeneration]);

  const clearCashRegisterAlert = useCallback(() => {
    dispatch({ type: 'clear-cash-register-alert' });
  }, []);

  return {
    ...state,
    openPreorderConfirmation,
    closePreorderConfirmation,
    setQuotationLoading,
    setPreorderSaving,
    setPreorderPrintData,
    setPendingPreorderPrint,
    requestCashRegisterAlert,
    clearCashRegisterAlert,
  };
}
