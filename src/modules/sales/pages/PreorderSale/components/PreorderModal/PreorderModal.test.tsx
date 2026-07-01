import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { PreorderModal } from './PreorderModal';
import type { InvoiceData } from '@/types/invoice';

describe('PreorderModal', () => {
  it('renders sold weight quantity and selected sale unit price', () => {
    const preorder: InvoiceData = {
      client: { name: 'Cliente preventa' },
      products: [
        {
          id: 'weighted-1',
          name: 'Producto pesado',
          amountToBuy: 1,
          pricing: { price: 100, tax: 0 },
          weightDetail: {
            isSoldByWeight: true,
            weight: 2.5,
            weightUnit: 'kg',
          },
        },
        {
          id: 'box-1',
          name: 'Producto caja',
          amountToBuy: 2,
          pricing: { price: 10, tax: 0 },
          selectedSaleUnit: {
            id: 'box-12',
            unitName: 'Caja',
            conversionFactorToBase: 12,
            pricing: { price: 500, tax: 0 },
          },
        },
      ],
      preorderDetails: { numberID: 'PRE-1' },
      totalPurchase: { value: 1250 },
    };

    render(<PreorderModal preorder={preorder} open onCancel={vi.fn()} />);

    expect(screen.getByText('Productos (2)')).toBeInTheDocument();
    expect(screen.getByText('Producto pesado')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
    expect(screen.getByText('Producto caja')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });
});
