import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { InvoiceData } from '@/types/invoice';

import { useInvoicePanelController } from './useInvoicePanelController';
import type { submitInvoicePanel } from '../utils/submitInvoicePanel';

const mocks = vi.hoisted(() => ({
  buildInvoiceSubmissionIdempotencyKey: vi.fn(() => 'invoice-key'),
  dispatch: vi.fn(),
  form: {
    setFieldsValue: vi.fn(),
  },
  handleCancelShipping: vi.fn(),
  messageInfo: vi.fn(),
  messageSuccess: vi.fn(),
  modalConfirm: vi.fn(),
  notificationError: vi.fn(),
  notificationSuccess: vi.fn(),
  notificationWarning: vi.fn(),
  printInvoice: vi.fn(),
  runInvoice: vi.fn(),
  submitInvoicePanel: vi.fn(),
  useDispatch: vi.fn(),
  useSelector: vi.fn(),
}));

vi.mock('antd', () => ({
  Form: {
    useForm: () => [mocks.form],
  },
  Modal: {
    confirm: mocks.modalConfirm,
  },
  message: {
    info: mocks.messageInfo,
    success: mocks.messageSuccess,
  },
  notification: {
    error: mocks.notificationError,
    success: mocks.notificationSuccess,
    warning: mocks.notificationWarning,
  },
}));

vi.mock('react-redux', () => ({
  useDispatch: (...args: unknown[]) => mocks.useDispatch(...args),
  useSelector: (...args: unknown[]) => mocks.useSelector(...args),
}));

vi.mock('react-to-print', () => ({
  useReactToPrint: () => mocks.printInvoice,
}));

vi.mock('@/services/invoice/useInvoice', () => ({
  default: () => ({ processInvoice: mocks.runInvoice }),
}));

vi.mock('@/hooks/useViewportWidth', () => ({
  default: () => 1024,
}));

vi.mock('@/modules/insurance/public', () => ({
  useInsuranceEnabled: () => false,
}));

vi.mock('../handleCancelShipping', () => ({
  handleCancelShipping: (...args: unknown[]) =>
    mocks.handleCancelShipping(...args),
}));

vi.mock('../utils/invoiceSubmissionIdempotency', () => ({
  buildInvoiceSubmissionIdempotencyKey: (...args: unknown[]) =>
    mocks.buildInvoiceSubmissionIdempotencyKey(...args),
}));

vi.mock('../utils/submitInvoicePanel', () => ({
  submitInvoicePanel: (...args: unknown[]) =>
    mocks.submitInvoicePanel(...args),
}));

vi.mock('@/firebase/quotation/downloadQuotationPDF', () => ({
  downloadInvoicePdf: vi.fn(),
}));

vi.mock('@/utils/perf/measure', () => ({
  measure: vi.fn((_label: string, callback: () => unknown) => callback()),
}));

type SubmitInvoicePanelArgs = Parameters<typeof submitInvoicePanel>[0];

const createdInvoice = {
  id: 'invoice-1',
  products: [{ id: 'product-1', name: 'Producto probado' }],
} as unknown as InvoiceData;

const createRootState = ({
  printPaginationEnabled = false,
}: {
  printPaginationEnabled?: boolean;
} = {}) => ({
  accountsReceivable: {
    ar: {},
  },
  app: {
    cashRegisterAlertBypass: false,
    mode: false,
    notificationMode: false,
  },
  business: {
    data: {
      features: {
        fiscal: {
          printPaginationEnabled,
        },
      },
      id: 'business-1',
      name: 'VentaMas Lab',
    },
  },
  cart: {
    data: {
      change: { value: 0 },
      isAddedToReceivables: false,
      paymentMethod: [{ method: 'cash', status: true, value: 100 }],
      products: [{ id: 'product-1', name: 'Producto probado' }],
      totalPurchase: { value: 100 },
    },
    settings: {
      billing: {
        hasDueDate: false,
        invoiceType: 'template1',
      },
      isInvoicePanelOpen: true,
      printInvoice: true,
    },
  },
  clientCart: {
    client: null,
  },
  insuranceAccountsReceivable: {
    insuranceAR: null,
  },
  insuranceAuth: {
    authData: null,
    error: null,
    loading: false,
    modal: false,
  },
  taxReceipt: {
    availableTypes: [],
    data: [],
    ncfCode: null,
    ncfStatus: false,
    ncfType: '',
    ncfTypeLocked: false,
    settings: {
      settingsLoaded: true,
      taxReceiptEnabled: false,
    },
  },
  user: {
    user: {
      businessID: 'business-1',
      uid: 'user-1',
    },
  },
});

const setupControllerTest = ({
  printPaginationEnabled = false,
}: {
  printPaginationEnabled?: boolean;
} = {}) => {
  const rootState = createRootState({ printPaginationEnabled });

  mocks.useDispatch.mockReturnValue(mocks.dispatch);
  mocks.useSelector.mockImplementation((selector: (state: unknown) => unknown) =>
    selector(rootState),
  );
  mocks.submitInvoicePanel.mockImplementation(
    async (args: SubmitInvoicePanelArgs) => {
      args.setInvoice(createdInvoice);
      if (args.shouldPrintInvoice) {
        await args.handleInvoicePrinting(createdInvoice);
        return;
      }
      args.handleAfterPrint();
    },
  );

  return renderHook(() => useInvoicePanelController());
};

describe('useInvoicePanelController print strategy integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.clearAllTimers();
    vi.clearAllMocks();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('uses legacy react-to-print when pagination is disabled', async () => {
    const { result } = setupControllerTest({
      printPaginationEnabled: false,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.pendingPaginatedPrint).toBe(false);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(80);
    });

    expect(mocks.printInvoice).toHaveBeenCalledTimes(1);
  });

  it('keeps the created invoice ready for a paginated retry when printing is blocked', async () => {
    const { result } = setupControllerTest({
      printPaginationEnabled: true,
    });

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.pendingPaginatedPrint).toBe(true);
    expect(mocks.printInvoice).not.toHaveBeenCalled();

    act(() => {
      result.current.handlePaginatedPrintBlocked('paginated-print-timeout');
    });

    expect(result.current.pendingPaginatedPrint).toBe(false);
    expect(result.current.printRecoveryReason).toBe('paginated-print-timeout');
    expect(result.current.invoice).toBe(createdInvoice);
    expect(mocks.notificationWarning).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Impresión paginada pendiente',
        description: expect.stringContaining('Reintenta'),
        duration: 6,
      }),
    );
    expect(mocks.printInvoice).not.toHaveBeenCalled();
    expect(mocks.submitInvoicePanel).toHaveBeenCalledTimes(1);
    expect(mocks.notificationError).not.toHaveBeenCalled();

    act(() => {
      result.current.retryPaginatedPrint();
    });

    expect(result.current.printRecoveryReason).toBeNull();
    expect(result.current.pendingPaginatedPrint).toBe(true);
    expect(mocks.submitInvoicePanel).toHaveBeenCalledTimes(1);
    expect(mocks.printInvoice).not.toHaveBeenCalled();
    expect(mocks.handleCancelShipping).not.toHaveBeenCalled();
  });

  it('opens the selected client editor from the fiscal data action', async () => {
    const { result } = setupControllerTest();
    const client = {
      id: 'client-1',
      name: 'Alanna Perez 2',
      personalID: '0020166033',
    };

    mocks.submitInvoicePanel.mockImplementationOnce(
      async (args: SubmitInvoicePanelArgs) => {
        args.requestClientFiscalDataAction?.({
          client,
          title: 'RNC/cédula del cliente no válido',
          description: 'El dato fiscal del cliente tiene 10 dígitos.',
        });
      },
    );

    await act(async () => {
      await result.current.handleSubmit();
    });

    expect(result.current.clientFiscalDataAction).toEqual(
      expect.objectContaining({
        client,
        title: 'RNC/cédula del cliente no válido',
      }),
    );

    act(() => {
      result.current.handleEditClientFiscalData();
    });

    expect(result.current.clientFiscalDataAction).toBeNull();
    expect(mocks.dispatch).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'modal/toggleClientModal',
        payload: expect.objectContaining({
          addClientToCart: true,
          data: client,
          mode: 'update',
        }),
      }),
    );
  });
});
