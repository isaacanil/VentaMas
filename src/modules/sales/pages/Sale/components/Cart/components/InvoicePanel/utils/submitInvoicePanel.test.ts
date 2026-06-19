import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { InvoiceProcessParams } from '@/services/invoice/types';
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

vi.mock('@/features/UserNotification/cashCountNotification', () => ({
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

  it('bloquea el envio cuando el modal queda abierto con carrito vacio', async () => {
    const args = baseArgs();
    args.cart = {
      ...args.cart,
      products: [],
      totalPurchase: { value: 0 },
      payment: { value: 0 },
    };

    await submitInvoicePanel(args as never);

    expect(notificationMock.warning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Venta sin productos',
      }),
    );
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

  it('reporta los estados de progreso durante el submit de venta', async () => {
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
    args.runInvoice = vi.fn(async (params: InvoiceProcessParams) => {
      params.onProgress?.('registering-sale');
      params.onProgress?.('confirming-invoice');
      return {
        invoice: { id: 'invoice-1', products: [] },
        status: 'committed',
      };
    });

    await submitInvoicePanel(args as never);

    expect(args.setLoading).toHaveBeenCalledWith({
      status: true,
      message: 'Validando venta',
    });
    expect(args.setLoading).toHaveBeenCalledWith({
      status: true,
      message: 'Registrando venta',
    });
    expect(args.setLoading).toHaveBeenCalledWith({
      status: true,
      message: 'Confirmando factura',
    });
    expect(args.setLoading).toHaveBeenCalledWith({
      status: true,
      message: 'Preparando comprobante/impresión',
    });
  });

  it('mantiene el carrito abierto cuando la factura queda pending', async () => {
    const args = baseArgs();
    const pendingInvoice = { id: 'invoice-pending', products: [] };
    args.business = {
      id: 'business-1',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: true,
        },
      },
    };
    args.runInvoice = vi.fn().mockResolvedValue({
      invoice: pendingInvoice,
      status: 'pending',
    });

    await submitInvoicePanel(args as never);

    expect(args.setInvoice).toHaveBeenCalledWith(null);
    expect(args.handleAfterPrint).not.toHaveBeenCalled();
    expect(args.handleInvoicePrinting).not.toHaveBeenCalled();
    expect(notificationMock.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Factura pendiente de confirmación',
      }),
    );
    expect(args.setLoading).toHaveBeenLastCalledWith({
      status: false,
      message: '',
    });
  });

  it('muestra mensaje especifico cuando la factura queda print_ready_with_review', async () => {
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
    args.runInvoice = vi.fn().mockResolvedValue({
      invoice: { id: 'invoice-review', products: [] },
      status: 'print_ready_with_review',
    });

    await submitInvoicePanel(args as never);

    expect(notificationMock.info).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Factura lista para imprimir con revisión pendiente',
        description:
          'Puedes imprimir la factura, pero quedó marcada para revisión operativa en el historial.',
      }),
    );
    expect(args.handleAfterPrint).toHaveBeenCalled();
  });

  it('normaliza la CxC efectiva antes de procesar una venta a credito', async () => {
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
      isAddedToReceivables: true,
      payment: { value: 100 },
      totalPurchase: { value: 300 },
    };
    args.accountsReceivable = {
      paymentFrequency: 'weekly',
      totalInstallments: 4,
      paymentDate: 1700000000000,
      comments: 'venta a credito',
    };

    await submitInvoicePanel(args as never);

    expect(args.runInvoice).toHaveBeenCalledWith(
      expect.objectContaining({
        accountsReceivable: expect.objectContaining({
          paymentFrequency: 'weekly',
          totalInstallments: 4,
          paymentDate: 1700000000000,
          comments: 'venta a credito',
          installmentAmount: 50,
          totalReceivable: 200,
        }),
      }),
    );
  });

  it('emite trazas sanitizadas del submit sin exponer carrito, factura ni idempotencyKey', async () => {
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
    args.runInvoice = vi.fn(async (params: InvoiceProcessParams) => {
      params.onPhaseTrace?.({
        phase: 'createInvoiceV2',
        status: 'started',
        attempt: 'primary',
      });
      params.onPhaseTrace?.({
        phase: 'createInvoiceV2',
        status: 'completed',
        attempt: 'primary',
        invoiceStatus: 'pending',
        reused: false,
      });
      params.onPhaseTrace?.({
        phase: 'waitForInvoiceResult',
        status: 'started',
        attempt: 'primary',
        reused: false,
      });
      params.onPhaseTrace?.({
        phase: 'waitForInvoiceResult',
        status: 'completed',
        attempt: 'primary',
        hasInvoice: true,
        invoiceStatus: 'committed',
        reused: false,
      });

      return {
        invoice: { id: 'invoice-1', products: [] },
        invoiceId: 'invoice-1',
        invoiceMeta: { status: 'committed' },
        canonical: null,
        status: 'committed',
        reused: false,
        idempotencyKey: 'cart:cart-1',
        attempt: 'primary',
      };
    });
    const consoleInfo = vi
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);

    try {
      await submitInvoicePanel(args as never);

      expect(args.runInvoice).toHaveBeenCalledWith(
        expect.objectContaining({
          onPhaseTrace: expect.any(Function),
        }),
      );

      const serializedLogs = JSON.stringify(consoleInfo.mock.calls);
      expect(serializedLogs).toContain('inicio');
      expect(serializedLogs).toContain('validaciones previas');
      expect(serializedLogs).toContain('runInvoice/createInvoiceV2');
      expect(serializedLogs).toContain('waitForInvoiceResult');
      expect(serializedLogs).toContain('impresion');
      expect(serializedLogs).toContain('cleanup');
      expect(serializedLogs).not.toContain('cart-1');
      expect(serializedLogs).not.toContain('cart:cart-1');
      expect(serializedLogs).not.toContain('invoice-1');
      expect(serializedLogs).not.toContain('product-1');
    } finally {
      consoleInfo.mockRestore();
    }
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

  it('muestra una recuperacion clara cuando la llave de idempotencia choca con otro payload', async () => {
    const args = baseArgs();
    const onIdempotencyConflict = vi.fn();
    args.business = {
      id: 'business-1',
      features: {
        fiscal: {
          electronicModelEnabled: true,
          electronicTransportEnabled: true,
        },
      },
    };
    args.runInvoice = vi.fn().mockRejectedValue(
      Object.assign(
        new Error('La llave de idempotencia ya fue utilizada con otro payload.'),
        {
          code: 'already-exists',
        },
      ),
    );

    await submitInvoicePanel({
      ...args,
      onIdempotencyConflict,
    } as never);

    expect(onIdempotencyConflict).toHaveBeenCalledTimes(1);
    expect(notificationMock.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Venta enviada con cambios',
        description: expect.stringContaining('Revisa el historial'),
      }),
    );
    expect(JSON.stringify(notificationMock.error.mock.calls)).not.toContain(
      'idempotencia',
    );
  });
});
