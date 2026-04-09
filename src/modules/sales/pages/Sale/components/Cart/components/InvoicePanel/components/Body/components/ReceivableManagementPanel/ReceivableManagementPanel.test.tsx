import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { describe, expect, it, vi } from 'vitest';

import { defaultAR } from '@/schema/accountsReceivable/accountsReceivable';

import { ReceivableManagementPanel } from './ReceivableManagementPanel';

vi.mock('@/firebase/accountsReceivable/fbGetPendingBalance', () => ({
  fbGetPendingBalance: () => () => undefined,
  useGetPendingBalance: () => 0,
  usePendingBalance: () => 0,
}));

vi.mock('antd', () => {
  type MockProps = Record<string, unknown> & {
    children?: ReactNode;
  };

  function MockButton({
    children,
    ...props
  }: MockProps) {
    return <button {...props}>{children}</button>;
  }

  function MockInput(props: Record<string, unknown>) {
    return <input {...props} />;
  }

  function MockInputTextArea({
    ...props
  }: Record<string, unknown>) {
    return <textarea {...props} />;
  }

  const Input = Object.assign(MockInput, {
    TextArea: MockInputTextArea,
  });

  function MockInputNumber({
    onChange,
    ...props
  }: {
    onChange?: (value: number) => void;
  } & Record<string, unknown>) {
    return (
      <input
        type="number"
        onChange={(event) => onChange?.(Number(event.currentTarget.value))}
        {...props}
      />
    );
  }

  function MockSelect({
    children,
    onChange,
    ...props
  }: {
    children?: ReactNode;
    onChange?: (value: string) => void;
  } & Record<string, unknown>) {
    return (
      <select
        onChange={(event) => onChange?.(event.currentTarget.value)}
        {...props}
      >
        {children}
      </select>
    );
  }

  function MockSelectOption({
    children,
    value,
  }: {
    children?: ReactNode;
    value: string;
  }) {
    return <option value={value}>{children}</option>;
  }

  const Select = Object.assign(MockSelect, {
    Option: MockSelectOption,
  });

  function MockForm({
    children,
  }: MockProps) {
    return <form>{children}</form>;
  }

  function MockFormItem({
    children,
    label,
  }: {
    children?: ReactNode;
    label?: ReactNode;
  } & Record<string, unknown>) {
    return (
      <div>
        {label ? <span>{label}</span> : null}
        {children}
      </div>
    );
  }

  const Form = Object.assign(MockForm, {
    Item: MockFormItem,
  });

  function MockModal({
    children,
    title,
    open,
  }: {
    children?: ReactNode;
    title?: ReactNode;
    open?: boolean;
  } & Record<string, unknown>) {
    return open ? (
      <div>
        {title ? <div>{title}</div> : null}
        {children}
      </div>
    ) : null;
  }

  return {
    Button: MockButton,
    Input,
    InputNumber: MockInputNumber,
    Select,
    Form,
    Modal: MockModal,
  };
});

vi.mock('@/components/DatePicker', () => ({
  default: ({
    disabledDate,
    ...props
  }: {
    disabledDate?: unknown;
    [key: string]: unknown;
  }) => <input data-testid="date-picker" {...props} />,
}));

vi.mock('../PaymentDatesOverview/PaymentDatesOverbiew', () => ({
  default: () => <div data-testid="payment-dates-overview" />,
}));

type BuildStoreArgs = {
  clientId: string;
};

const buildStore = ({ clientId }: BuildStoreArgs) => {
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

type RenderPanelArgs = {
  clientId?: string;
  isOpen?: boolean;
  isChangeNegative?: boolean;
  receivableStatus?: boolean;
};

const renderPanel = ({
  clientId = 'CL-123',
  isOpen = true,
  isChangeNegative = false,
  receivableStatus = false,
}: RenderPanelArgs = {}) => {
  const store = buildStore({ clientId });
  const closePanel = vi.fn();

  const Wrapper = () => (
    <Provider store={store}>
      <ReceivableManagementPanel
        isOpen={isOpen}
        closePanel={closePanel}
        form={undefined}
        creditLimit={{ creditLimit: { value: 1000 } }}
        isChangeNegative={isChangeNegative}
        receivableStatus={receivableStatus}
      />
    </Provider>
  );

  return {
    closePanel,
    ...render(<Wrapper />),
  };
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

  it('stays open while configuring a negative balance receivable', () => {
    const { closePanel } = renderPanel({ isChangeNegative: true });
    expect(screen.getByText('Balance pendiente')).toBeInTheDocument();
    expect(closePanel).not.toHaveBeenCalled();
  });
});
