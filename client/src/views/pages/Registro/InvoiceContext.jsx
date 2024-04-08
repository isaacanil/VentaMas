// InvoicesContext.js
import React, { createContext, useContext, useReducer } from 'react';

// Define the context
const InvoicesContext = createContext();

// Example action types
const SORT_INVOICES = 'SORT_INVOICES';
const FILTER_INVOICES = 'FILTER_INVOICES';

// Reducer to handle actions
function invoicesReducer(state, action) {
  switch (action.type) {
    case SORT_INVOICES:
      // Implement your sorting logic here.
      // This is just an example. Adjust it according to your needs.
      return { ...state, invoices: action.payload.sort((a, b) => a.amount - b.amount) };
    case FILTER_INVOICES:
      // Implement your filtering logic here.
      // This is just an example. Adjust it according to your needs.
      return { ...state, invoices: action.payload.filter(invoice => invoice.status === action.filter) };
    default:
      return state;
  }
}

// Provider component that wraps the part of your application that needs access to the context
export function InvoicesProvider({ children }) {
  const initialState = { invoices: [] };
  const [state, dispatch] = useReducer(invoicesReducer, initialState);

  // Function to sort invoices
  const sortInvoices = (sortedInvoices) => {
    dispatch({ type: SORT_INVOICES, payload: sortedInvoices });
  };

  // Function to filter invoices
  const filterInvoices = (invoices, filter) => {
    dispatch({ type: FILTER_INVOICES, payload: invoices, filter: filter });
  };

  return (
    <InvoicesContext.Provider value={{ state, sortInvoices, filterInvoices }}>
      {children}
    </InvoicesContext.Provider>
  );
}

// Custom hook to use the invoices context
export function useInvoices() {
  const context = useContext(InvoicesContext);
  if (context === undefined) {
    throw new Error('useInvoices must be used within an InvoicesProvider');
  }
  return context;
}
