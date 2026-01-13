// InvoicesContext.js
import React, { createContext, useReducer } from 'react';
import type { ReactNode } from 'react';
import type { InvoiceRecord } from '@/modules/invoice/pages/InvoicesPage/types';

// Define the context
type InvoiceContextState = {
  invoices: InvoiceRecord[];
};

type SortAction = {
  type: typeof SORT_INVOICES;
  payload: InvoiceRecord[];
};

type FilterAction = {
  type: typeof FILTER_INVOICES;
  payload: InvoiceRecord[];
  filter: string;
};

type InvoiceAction = SortAction | FilterAction;

type InvoiceContextValue = {
  state: InvoiceContextState;
  sortInvoices: (sortedInvoices: InvoiceRecord[]) => void;
  filterInvoices: (invoices: InvoiceRecord[], filter: string) => void;
};

const InvoicesContext = createContext<InvoiceContextValue | null>(null);

// Example action types
const SORT_INVOICES = 'SORT_INVOICES';
const FILTER_INVOICES = 'FILTER_INVOICES';

// Reducer to handle actions
function invoicesReducer(state: InvoiceContextState, action: InvoiceAction): InvoiceContextState {
  switch (action.type) {
    case SORT_INVOICES:
      // Implement your sorting logic here.
      // This is just an example. Adjust it according to your needs.
      return {
        ...state,
        invoices: action.payload.sort(
          (a, b) =>
            Number(a.data?.totalPurchase?.value ?? 0) -
            Number(b.data?.totalPurchase?.value ?? 0),
        ),
      };
    case FILTER_INVOICES:
      // Implement your filtering logic here.
      // This is just an example. Adjust it according to your needs.
      return {
        ...state,
        invoices: action.payload.filter(
          (invoice) => invoice.data?.status === action.filter,
        ),
      };
    default:
      return state;
  }
}

// Provider component that wraps the part of your application that needs access to the context
export function InvoicesProvider({ children }: { children: ReactNode }) {
  const initialState: InvoiceContextState = { invoices: [] };
  const [state, dispatch] = useReducer(invoicesReducer, initialState);

  // Function to sort invoices
  const sortInvoices = (sortedInvoices: InvoiceRecord[]) => {
    dispatch({ type: SORT_INVOICES, payload: sortedInvoices });
  };

  // Function to filter invoices
  const filterInvoices = (invoices: InvoiceRecord[], filter: string) => {
    dispatch({ type: FILTER_INVOICES, payload: invoices, filter: filter });
  };

  return (
    <InvoicesContext.Provider value={{ state, sortInvoices, filterInvoices }}>
      {children}
    </InvoicesContext.Provider>
  );
}
