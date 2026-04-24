import { configureStore } from '@reduxjs/toolkit';
import { render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import cartReducer from '@/features/cart/cartSlice';

import { DocumentCurrencySelector } from './DocumentCurrencySelector';

const useDocumentCurrencyConfigMock = vi.hoisted(() => vi.fn());

vi.mock('./useDocumentCurrencyConfig', () => ({
  useDocumentCurrencyConfig: (...args: unknown[]) =>
    useDocumentCurrencyConfigMock(...args),
}));

vi.mock('@floating-ui/react', () => ({
  autoUpdate: vi.fn(),
  flip: vi.fn(() => ({})),
  offset: vi.fn(() => ({})),
  shift: vi.fn(() => ({})),
  useFloating: () => ({
    refs: {
      reference: { current: null },
      setReference: vi.fn(),
      setFloating: vi.fn(),
    },
    floatingStyles: {},
  }),
}));

vi.mock('@/hooks/useClickOutSide', () => ({
  useClickOutSide: vi.fn(),
}));

vi.mock('@ant-design/icons', () => ({
  DollarOutlined: () => <span data-testid="icon-dollar" />,
  DownOutlined: () => <span data-testid="icon-down" />,
  InfoCircleOutlined: () => <span data-testid="icon-info" />,
  LockOutlined: () => <span data-testid="icon-lock" />,
  WarningOutlined: () => <span data-testid="icon-warning" />,
}));

vi.mock('antd', () => {
  function Tag({
    children,
  }: {
    children?: ReactNode;
    color?: string;
  }) {
    return <span>{children}</span>;
  }

  function Tooltip({ children }: { children?: ReactNode; title?: ReactNode }) {
    return <>{children}</>;
  }

  function Select({
    value,
    onChange,
    options = [],
    disabled,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    options?: Array<{ value: string; label: ReactNode }>;
    disabled?: boolean;
  }) {
    return (
      <select
        aria-label="Moneda de la factura"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange?.(event.currentTarget.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  }

  return {
    Select,
    Tag,
    Tooltip,
    Typography: {
      Text: ({ children }: { children?: ReactNode }) => <span>{children}</span>,
    },
  };
});

const buildStore = () => {
  const baseState = cartReducer(undefined, { type: 'test/init' });

  return configureStore({
    reducer: {
      cart: cartReducer,
    },
    preloadedState: {
      cart: {
        ...baseState,
        data: {
          ...baseState.data,
          documentCurrency: 'USD',
          functionalCurrency: 'DOP',
          exchangeRate: 60,
          products: [],
        },
      },
    },
  });
};

const buildStaleRateTimestamp = (): number => {
  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - 1);
  staleDate.setHours(10, 0, 0, 0);
  return staleDate.getTime();
};

describe('DocumentCurrencySelector stale rate guard', () => {
  beforeEach(() => {
    useDocumentCurrencyConfigMock.mockReturnValue({
      enabled: true,
      loading: false,
      error: null,
      config: {
        functionalCurrency: 'DOP',
        documentCurrencies: ['DOP', 'USD'],
        manualRatesByCurrency: {
          USD: {
            purchase: 58,
            sale: 60,
            effectiveAt: buildStaleRateTimestamp(),
          },
        },
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('bloquea moneda extranjera cuando la tasa no es del dia', async () => {
    const onChange = vi.fn();
    const store = buildStore();

    render(
      <Provider store={store}>
        <DocumentCurrencySelector businessId="business-1" onChange={onChange} />
      </Provider>,
    );

    expect(screen.getByText('Tasa vencida')).toBeInTheDocument();
    expect(
      screen.getByText(/no esta vigente para hoy/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(
        expect.objectContaining({
          documentCurrency: 'USD',
          blockedReason: expect.stringContaining('no esta vigente para hoy'),
        }),
      );
    });

    expect(onChange.mock.calls.at(-1)?.[0]).not.toHaveProperty(
      'exchangeRate',
    );
    await waitFor(() => {
      expect(store.getState().cart.data.exchangeRate).toBeNull();
    });
  });
});
