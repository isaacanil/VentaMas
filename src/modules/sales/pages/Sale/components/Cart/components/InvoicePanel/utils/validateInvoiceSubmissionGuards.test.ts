import { beforeEach, describe, expect, it, vi } from 'vitest';

import { checkOpenCashReconciliation } from '@/firebase/cashCount/useIsOpenCashReconciliation';
import { getProductStockByProductId } from '@/firebase/warehouse/productStockService';

import { validateInvoiceSubmissionGuards } from './validateInvoiceSubmissionGuards';

vi.mock('@/firebase/cashCount/useIsOpenCashReconciliation', () => ({
  checkOpenCashReconciliation: vi.fn(),
}));

vi.mock('@/firebase/warehouse/productStockService', () => ({
  getProductStockByProductId: vi.fn(),
}));

describe('validateInvoiceSubmissionGuards', () => {
  const user = {
    uid: 'user-1',
    businessID: 'business-1',
  } as const;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('bloquea el submit cuando faltan datos del usuario actual', async () => {
    const result = await validateInvoiceSubmissionGuards({
      cart: { products: [] },
      user: null,
    });

    expect(result).toEqual({
      ok: false,
      code: 'cash-count',
      cashCountState: 'none',
      message: 'No se pudo validar el cuadre de caja',
      description:
        'Faltan datos del usuario actual para confirmar la caja abierta antes de facturar.',
    });
    expect(checkOpenCashReconciliation).not.toHaveBeenCalled();
  });

  it('bloquea el submit cuando no hay cuadre de caja abierto', async () => {
    vi.mocked(checkOpenCashReconciliation).mockResolvedValue({
      state: 'closed',
      cashCount: null,
    });

    const result = await validateInvoiceSubmissionGuards({
      cart: { products: [] },
      user: user as never,
    });

    expect(result).toEqual({
      ok: false,
      code: 'cash-count',
      cashCountState: 'closed',
      message: 'No se puede facturar sin un cuadre abierto',
      description:
        'No hay un cuadre de caja abierto para el usuario actual. Abre uno antes de facturar.',
    });
    expect(getProductStockByProductId).not.toHaveBeenCalled();
  });

  it('muestra un mensaje específico cuando la caja está en cierre', async () => {
    vi.mocked(checkOpenCashReconciliation).mockResolvedValue({
      state: 'closing',
      cashCount: null,
    });

    const result = await validateInvoiceSubmissionGuards({
      cart: { products: [] },
      user: user as never,
    });

    expect(result).toEqual({
      ok: false,
      code: 'cash-count',
      cashCountState: 'closing',
      message: 'No se puede facturar sin un cuadre abierto',
      description:
        'Hay un cuadre de caja en proceso de cierre. Debes esperar a que termine o reabrirlo antes de facturar.',
    });
  });

  it('bloquea el submit cuando falta seleccionar la existencia fisica', async () => {
    vi.mocked(checkOpenCashReconciliation).mockResolvedValue({
      state: 'open',
      cashCount: {} as never,
    });
    vi.mocked(getProductStockByProductId).mockResolvedValue([
      {
        id: 'stock-1',
        batchId: 'batch-1',
        quantity: 1,
        location: 'shelf-a',
      },
      {
        id: 'stock-2',
        batchId: 'batch-2',
        quantity: 1,
        location: 'shelf-b',
      },
    ] as never);

    const result = await validateInvoiceSubmissionGuards({
      cart: {
        products: [
          {
            id: 'product-1',
            name: 'Acetaminofen',
            amountToBuy: 1,
            restrictSaleWithoutStock: true,
          },
        ],
      },
      user: user as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: 'physical-selection',
        message: 'Selecciona una existencia física antes de facturar',
      }),
    );
    if (result.ok) {
      throw new Error('Se esperaba una falla de selección física');
    }
    expect(result.description).toContain('2 ubicaciones');
    expect(result.product.id).toBe('product-1');
    expect(getProductStockByProductId).toHaveBeenCalledWith(user, {
      productId: 'product-1',
    });
  });

  it('permite el submit cuando hay caja abierta y todos los productos estrictos ya tienen lote', async () => {
    vi.mocked(checkOpenCashReconciliation).mockResolvedValue({
      state: 'open',
      cashCount: {} as never,
    });

    const result = await validateInvoiceSubmissionGuards({
      cart: {
        products: [
          {
            id: 'product-2',
            name: 'Vitamina C',
            amountToBuy: 1,
            restrictSaleWithoutStock: true,
            productStockId: 'stock-ok',
            batchId: 'batch-ok',
          },
        ],
      },
      user: user as never,
    });

    expect(result).toEqual({ ok: true });
    expect(getProductStockByProductId).not.toHaveBeenCalled();
  });

  it('permite el submit cuando no hay productos con selección física pendiente', async () => {
    vi.mocked(checkOpenCashReconciliation).mockResolvedValue({
      state: 'open',
      cashCount: {} as never,
    });

    const result = await validateInvoiceSubmissionGuards({
      cart: {
        products: [
          {
            id: 'product-3',
            name: 'Servicio',
            amountToBuy: 1,
            restrictSaleWithoutStock: false,
          },
        ],
      },
      user: user as never,
    });

    expect(result).toEqual({ ok: true });
    expect(getProductStockByProductId).not.toHaveBeenCalled();
  });

  it('devuelve un mensaje genérico cuando falla la consulta de inventario', async () => {
    vi.mocked(checkOpenCashReconciliation).mockResolvedValue({
      state: 'open',
      cashCount: {} as never,
    });
    vi.mocked(getProductStockByProductId).mockRejectedValue(
      new Error('network error'),
    );

    const result = await validateInvoiceSubmissionGuards({
      cart: {
        products: [
          {
            id: 'product-4',
            name: 'Acetaminofen',
            amountToBuy: 1,
            restrictSaleWithoutStock: true,
          },
        ],
      },
      user: user as never,
    });

    expect(result).toEqual(
      expect.objectContaining({
        ok: false,
        code: 'physical-selection',
        message: 'Selecciona una existencia física antes de facturar',
      }),
    );
    if (result.ok) {
      throw new Error('Se esperaba una falla de selección física');
    }
    expect(result.description).toContain('no tiene existencias físicas disponibles');
  });
});
