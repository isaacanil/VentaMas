import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';

import { updateProductFields } from '@/features/cart/cartSlice';
import { ProductBatchModal } from './ProductBatchModal';

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  fetchLocationName: vi.fn(),
  modalConfirm: vi.fn(),
  notificationWarning: vi.fn(),
  state: {
    current: {} as any,
  },
}));

vi.mock('react-redux', () => ({
  useDispatch: () => mocks.dispatch,
  useSelector: (selector: (state: unknown) => unknown) =>
    selector(mocks.state.current),
}));

vi.mock('@/modules/inventory/hooks/useProductStock', () => ({
  useListenProductsStock: () => ({ data: [], loading: false }),
}));

vi.mock('@/modules/inventory/hooks/useLocationNames', () => ({
  useLocationNames: () => ({
    fetchLocationName: mocks.fetchLocationName,
    locationNames: {
      'warehouse-a': 'Almacen A',
    },
  }),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual<typeof import('antd')>('antd');
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({
        modal: {
          confirm: mocks.modalConfirm,
        },
        notification: {
          warning: mocks.notificationWarning,
        },
      }),
    },
  };
});

const buildState = ({
  cartProducts,
  product,
}: {
  cartProducts: unknown[];
  product: Record<string, unknown>;
}) => ({
  cart: {
    data: {
      products: cartProducts,
    },
  },
  filterProducts: {
    contexts: {},
    meta: {},
  },
  productStockSimple: {
    isOpen: true,
    product,
    productId: product.id,
    productStockSelected: '',
    selectedProductStock: null,
    initialStocksProductId: product.id,
    initialStocks: [
      {
        id: 'stock-1',
        batchId: 'batch-1',
        batchNumberId: 'B-1',
        quantity: 5,
        location: 'warehouse-a',
      },
    ],
  },
});

describe('ProductBatchModal stock guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks selecting a physical stock already consumed by other weighted lines', () => {
    mocks.state.current = buildState({
      product: {
        id: 'beef',
        name: 'Carne',
        restrictSaleWithoutStock: true,
        weightDetail: {
          isSoldByWeight: true,
          weight: 2,
          weightUnit: 'kg',
        },
      },
      cartProducts: [
        {
          id: 'beef',
          cid: 'line-1',
          productStockId: 'stock-1',
          batchId: 'batch-1',
          stock: 5,
          baseQuantity: 4,
          weightDetail: {
            isSoldByWeight: true,
            weight: 4,
            weightUnit: 'kg',
          },
        },
      ],
    });

    render(<ProductBatchModal />);

    fireEvent.click(screen.getByText('Lote #B-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mocks.notificationWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Cantidad máxima alcanzada',
      }),
    );
    expect(mocks.dispatch).not.toHaveBeenCalled();
  });

  it('excludes the current line when editing its physical stock selection', () => {
    mocks.state.current = buildState({
      product: {
        id: 'beef',
        cid: 'line-1',
        name: 'Carne',
        restrictSaleWithoutStock: true,
        baseQuantity: 4,
        weightDetail: {
          isSoldByWeight: true,
          weight: 4,
          weightUnit: 'kg',
        },
      },
      cartProducts: [
        {
          id: 'beef',
          cid: 'line-1',
          productStockId: 'stock-1',
          batchId: 'batch-1',
          stock: 5,
          baseQuantity: 4,
          weightDetail: {
            isSoldByWeight: true,
            weight: 4,
            weightUnit: 'kg',
          },
        },
      ],
    });

    render(<ProductBatchModal />);

    fireEvent.click(screen.getByText('Lote #B-1'));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));

    expect(mocks.notificationWarning).not.toHaveBeenCalled();
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: updateProductFields.type,
      }),
    );
  });
});
