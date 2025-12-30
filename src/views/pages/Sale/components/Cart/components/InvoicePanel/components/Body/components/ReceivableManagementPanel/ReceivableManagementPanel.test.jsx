import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { defaultAR } from '@/schema/accountsReceivable/accountsReceivable';

import { ReceivableManagementPanel } from './ReceivableManagementPanel';

vi.mock('@/firebase/accountsReceivable/fbGetPendingBalance', () => ({
  fbGetPendingBalance: () => () => undefined,
  useGetPendingBalance: () => 0,
  usePendingBalance: () => 0,
}));

vi.mock('@/components/DatePicker', () => ({
  default: ({ _disabledDate, ...props }) => (
    <input data-testid="date-picker" {...props} />
  ),
}));

vi.mock('../PaymentDatesOverview/PaymentDatesOverbiew', () => ({
  default: () => <div data-testid="payment-dates-overview" />,
}));

const buildStore = ({ clientId }) => {
  const accountsReceivableState = {
    ar: {
      ...defaultAR,
      paymentFrequency: 'monthly',
      totalInstallments: 1,
      paymentDate: 1700000000000,
      currentBalance: 0,
      installmentAmount: 0,
      comments: '',
    },
  };
  const cartState = {
    data: {
      payment: { value: 0 },
      totalPurchase: { value: 0 },
    },
  };
  const clientCartState = {
    client: {
      id: clientId,
      name: 'Test Client',
    },
  };
  const userState = {
    user: { businessID: 'test-business' },
  };

  return configureStore({
    reducer: {
      accountsReceivable: (state = accountsReceivableState) => state,
      cart: (state = cartState) => state,
      clientCart: (state = clientCartState) => state,
      user: (state = userState) => state,
    },
  });
};

const renderPanel = ({ clientId = 'CL-123', isOpen = true } = {}) => {
  const store = buildStore({ clientId });
  const closePanel = vi.fn();

  const Wrapper = () => (
    <Provider store={store}>
      <ReceivableManagementPanel
        isOpen={isOpen}
        closePanel={closePanel}
        form={undefined}
        creditLimit={{ creditLimit: { value: 1000 } }}
        isChangeNegative={false}
        receivableStatus={false}
      />
    </Provider>
  );

  return render(<Wrapper />);
};

describe('ReceivableManagementPanel', () => {
  it('renders when a valid client is selected', () => {
    renderPanel();
    expect(screen.getByText('Balance pendiente')).toBeInTheDocument();
  });

  it('does not render when client is invalid', () => {
    renderPanel({ clientId: 'GC-0000' });
    expect(screen.queryByText('Balance pendiente')).toBeNull();
  });
});
