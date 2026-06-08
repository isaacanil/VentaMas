import { beforeEach, describe, expect, it, vi } from 'vitest';

import { validateInvoiceSubmissionGuards } from './validateInvoiceSubmissionGuards';
import { submitInvoicePanel } from './submitInvoicePanel';

const notificationMock = vi.hoisted(() => ({
  error: vi.fn(),
  info: vi.fn(),
  success: vi.fn(),
  warning: vi.fn(),
}));

vi.mock('antd', () => ({
  notification: notificationMock,
}));

vi.mock('@/features/productStock/productStockSimpleSlice', () => ({
  openProductStockSimple: vi.fn((product) => ({
    type: 'productStock/open',
    payload: product,
  })),
}));

vi.mock('@/notification/cashCountNotification/cashCountNotificacion', () => ({
  getCashCountStrategy: vi.fn(() => ({
    handleConfirm: vi.fn(),
  })),
}));

vi.mock('@/services/invoice/logInvoiceAuthorizations', () => ({
  default: vi.fn(),
}));

vi.mock('@/utils/perf/measure', () => ({
  measure: vi.fn((_label: string, callback: () => unknown) => callback()),
}));

vi.mock('./validateInvoiceSubmissionGuards', () => ({
  validateInvoiceSubmissionGuards: vi.fn(),
}));

const baseArgs = () => ({
  accountsReceivable: {},
  business: { id: 'business-1' },
  cart: {
    id: 'cart-1',
    products: [{ id: 'product-1', amountToBuy: 1 }],
    totalPurchase: { value: 118 },
    payment: { value: 118 },
  },
  client: null,
  dispatch: vi.fn(),
  duePeriod: null,
  form: { validateFields: vi.fn() },
  handleAfterPrint: vi.fn(),
  handleInvoicePrinting: vi.fn(),
  hasDueDate: false,
  idempotencyKey: 'cart:cart-1',
  insuranceAR: null,
  insuranceAuth: null,
  insuranceEnabled: false,
  invoiceComment: null,
  isTestMode: false,
  monetaryContext: null,
  ncfType: 'CONSUMIDOR FINAL',
  resolvedBusinessId: 'business-1',
  runInvoice: vi.fn().mockResolvedValue({
    invoice: { id: 'invoice-1', products: [] },
    status: 'committed',
  }),
  setInvoice: vi.fn(),
  setLoading: vi.fn(),
  setSubmitted: vi.fn(),
  setTaxReceiptModalOpen: vi.fn(),
  shouldPrintInvoice: false,
  taxReceiptData: [
    {
      data: {
        name: 'CONSUMIDOR FINAL',
        type: 'B',
        serie: '02',
        quantity: '0',
        increase: 1,
        sequence: '438',
      },
    },
  ],
  taxReceiptEnabled: true,
  user: { uid: 'user-1', businessID: 'business-1' },
});

describe('submitInvoicePanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(validateInvoiceSubmissionGuards).mockResolvedValue({
      ok: true,
    });
  });

  it('bloquea por disponibilidad local cuando el negocio sigue en NCF legacy', async () => {
    const args = baseArgs();

    await submitInvoicePanel(args as never);

    expect(args.setTaxReceiptModalOpen).toHaveBeenCalledWith(true);
    expect(args.runInvoice).not.toHaveBeenCalled();
  });

  it('no bloquea por disponibilidad Bxx cuando el modelo e-CF esta activo', async () => {
    const args = baseArgs();
    args.business = {
      id: 'business-1',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: true,
        },
      },
    };

    await submitInvoicePanel(args as never);

    expect(args.setTaxReceiptModalOpen).not.toHaveBeenCalledWith(true);
    expect(args.runInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        taxReceiptEnabled: true,
        ncfType: 'CONSUMIDOR FINAL',
      }),
    );
  });

  it('bloquea comprobante fiscal detallado sin cliente identificado', async () => {
    const args = baseArgs();
    args.business = {
      id: 'business-1',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: true,
        },
      },
    };
    args.ncfType = 'CREDITO FISCAL';

    await submitInvoicePanel(args as never);

    expect(notificationMock.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Cliente fiscal requerido',
      }),
    );
    expect(args.runInvoice).not.toHaveBeenCalled();
  });

  it('permite consumidor final menor a RD$250,000 con cliente generico', async () => {
    const args = baseArgs();
    args.business = {
      id: 'business-1',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: true,
        },
      },
    };
    args.client = { id: 'GC-0000', name: 'Cliente Generico' };

    await submitInvoicePanel(args as never);

    expect(args.runInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        taxReceiptEnabled: true,
        ncfType: 'CONSUMIDOR FINAL',
      }),
    );
  });

  it('bloquea consumidor final desde RD$250,000 sin cliente identificado', async () => {
    const args = baseArgs();
    args.business = {
      id: 'business-1',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: true,
        },
      },
    };
    args.cart = {
      ...args.cart,
      totalPurchase: { value: 250000 },
      payment: { value: 250000 },
    };

    await submitInvoicePanel(args as never);

    expect(notificationMock.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Cliente fiscal requerido',
      }),
    );
    expect(args.runInvoice).not.toHaveBeenCalled();
  });
});
