import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ProductsTable from './ProductsTable';

describe('ProductsTable', () => {
  it('does not render nested table cells in receipt mode', () => {
    const { container } = render(
      <ProductsTable
        mode="complete"
        products={[
          {
            id: 'line-1',
            name: 'Producto A',
            quantity: 10,
            orderedQuantity: 10,
            purchaseQuantity: 10,
            receivedQuantity: 2,
            pendingQuantity: 8,
            baseCost: 15,
            taxPercentage: 18,
            freight: 0,
            otherCosts: 0,
            unitCost: 15,
            subtotal: 150,
          } as any,
        ]}
        removeProduct={vi.fn()}
        onEditProduct={vi.fn()}
        onQuantityClick={vi.fn()}
        initialReceivedMap={new Map([['line-1', 2]])}
      />,
    );

    expect(container.querySelector('td td')).not.toBeInTheDocument();
  });
});
