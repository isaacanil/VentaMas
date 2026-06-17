import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ElectronicTaxReceiptSnapshot,
  InvoiceData,
} from '@/types/invoice';

import type { InvoiceRecord } from '../types';
import { usePendingElectronicTaxReceiptAutoRefresh } from './usePendingElectronicTaxReceiptAutoRefresh';

const FIRST_REFRESH_DELAY_MS = 45_000;
const MIN_REMOTE_REFRESH_INTERVAL_MS = 3 * 60_000;
const SESSION_REFRESH_INTERVAL_MS = 10 * 60_000;
const BASE_NOW = Date.parse('2026-06-15T16:00:00.000Z');

type MockUser = {
  activeBusinessId?: string;
  businessID?: string;
  businessId?: string;
  id?: string;
  uid?: string;
};

type MockRootState = {
  user: {
    user: MockUser | null;
  };
};

const mocks = vi.hoisted(() => {
  const mockRootState: MockRootState = {
    user: {
      user: null,
    },
  };

  return {
    fbRefreshElectronicTaxReceiptStatus: vi.fn(),
    mockRootState,
    selectUser: vi.fn((state: MockRootState) => state.user.user),
    useSelector: vi.fn((selector: (state: MockRootState) => unknown) =>
      selector(mockRootState),
    ),
  };
});

vi.mock('react-redux', () => ({
  useSelector: (...args: unknown[]) => mocks.useSelector(...args),
}));

vi.mock('@/features/auth/userSlice', () => ({
  selectUser: (...args: unknown[]) => mocks.selectUser(...args),
}));

vi.mock(
  '@/firebase/electronicTaxReceipts/fbRefreshElectronicTaxReceiptStatus',
  () => ({
    fbRefreshElectronicTaxReceiptStatus: (...args: unknown[]) =>
      mocks.fbRefreshElectronicTaxReceiptStatus(...args),
  }),
);

const setMockUser = (user: MockUser | null = { businessID: 'business-1' }) => {
  mocks.mockRootState.user.user = user;
};

const makeSnapshot = ({
  lastSyncAt,
  status = 'pending',
  submissionId,
}: {
  lastSyncAt?: number;
  status?: string;
  submissionId: string;
}): ElectronicTaxReceiptSnapshot => ({
  lastSyncAt,
  status,
  submissionId,
});

const makeInvoice = ({
  dateMs = BASE_NOW - FIRST_REFRESH_DELAY_MS,
  id,
  lastSyncAt,
  status = 'pending',
  submissionId = `submission-${id}`,
}: {
  dateMs?: number;
  id: string;
  lastSyncAt?: number;
  status?: string;
  submissionId?: string;
}): InvoiceData => ({
  date: dateMs,
  electronicTaxReceipt: makeSnapshot({
    lastSyncAt,
    status,
    submissionId,
  }),
  id,
});

const makeRecord = (invoice: InvoiceData): InvoiceRecord => ({
  data: invoice,
  id: invoice.id,
});

const sessionKeyFor = (
  invoice: InvoiceData,
  businessId = 'business-1',
): string =>
  `ecf-status-refresh:${businessId}:${invoice.id}:${invoice.electronicTaxReceipt?.submissionId}`;

const flushRefreshQueue = async () => {
  await act(async () => {
    for (let index = 0; index < 10; index += 1) {
      await Promise.resolve();
    }
  });
};

describe('usePendingElectronicTaxReceiptAutoRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(BASE_NOW);
    window.sessionStorage.clear();

    mocks.fbRefreshElectronicTaxReceiptStatus.mockReset();
    mocks.fbRefreshElectronicTaxReceiptStatus.mockResolvedValue({
      ok: true,
    });
    mocks.selectUser.mockClear();
    mocks.useSelector.mockClear();
    setMockUser();
  });

  afterEach(() => {
    window.sessionStorage.clear();
    vi.useRealTimers();
  });

  it('no refresca cuando esta deshabilitado, falta negocio o no hay facturas', async () => {
    const eligibleInvoice = makeRecord(
      makeInvoice({
        id: 'invoice-ready',
        lastSyncAt: BASE_NOW - MIN_REMOTE_REFRESH_INTERVAL_MS,
      }),
    );

    const disabledHook = renderHook(() =>
      usePendingElectronicTaxReceiptAutoRefresh({
        enabled: false,
        invoices: [eligibleInvoice],
      }),
    );
    disabledHook.unmount();

    setMockUser({ id: 'user-without-business' });
    const missingBusinessHook = renderHook(() =>
      usePendingElectronicTaxReceiptAutoRefresh({
        invoices: [eligibleInvoice],
      }),
    );
    missingBusinessHook.unmount();

    setMockUser();
    const emptyInvoicesHook = renderHook(() =>
      usePendingElectronicTaxReceiptAutoRefresh({
        invoices: [],
      }),
    );
    emptyInvoicesHook.unmount();

    await flushRefreshQueue();

    expect(mocks.useSelector).toHaveBeenCalled();
    expect(mocks.selectUser).toHaveBeenCalled();
    expect(mocks.fbRefreshElectronicTaxReceiptStatus).not.toHaveBeenCalled();
  });

  it('espera 45 segundos desde la fecha de la factura antes de refrescar', async () => {
    const invoice = makeInvoice({
      dateMs: BASE_NOW - FIRST_REFRESH_DELAY_MS + 1,
      id: 'invoice-young',
      lastSyncAt: BASE_NOW - MIN_REMOTE_REFRESH_INTERVAL_MS,
    });
    const record = makeRecord(invoice);

    const { rerender, unmount } = renderHook(
      ({ invoices }: { invoices: InvoiceRecord[] }) =>
        usePendingElectronicTaxReceiptAutoRefresh({ invoices }),
      {
        initialProps: {
          invoices: [record],
        },
      },
    );

    await flushRefreshQueue();
    expect(mocks.fbRefreshElectronicTaxReceiptStatus).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    rerender({ invoices: [record] });

    await flushRefreshQueue();

    expect(mocks.fbRefreshElectronicTaxReceiptStatus).toHaveBeenCalledTimes(1);
    expect(mocks.fbRefreshElectronicTaxReceiptStatus).toHaveBeenCalledWith({
      businessId: 'business-1',
      invoiceId: 'invoice-young',
      refreshRemote: true,
    });
    expect(window.sessionStorage.getItem(sessionKeyFor(invoice))).toBe(
      String(BASE_NOW + 1),
    );

    unmount();
  });

  it('respeta el intervalo remoto minimo de 3 minutos', async () => {
    const invoice = makeInvoice({
      id: 'invoice-recent-sync',
      lastSyncAt: BASE_NOW - MIN_REMOTE_REFRESH_INTERVAL_MS + 1,
    });
    const record = makeRecord(invoice);

    const { rerender, unmount } = renderHook(
      ({ invoices }: { invoices: InvoiceRecord[] }) =>
        usePendingElectronicTaxReceiptAutoRefresh({ invoices }),
      {
        initialProps: {
          invoices: [record],
        },
      },
    );

    await flushRefreshQueue();
    expect(mocks.fbRefreshElectronicTaxReceiptStatus).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });
    rerender({ invoices: [record] });

    await flushRefreshQueue();

    expect(mocks.fbRefreshElectronicTaxReceiptStatus).toHaveBeenCalledTimes(1);
    expect(mocks.fbRefreshElectronicTaxReceiptStatus).toHaveBeenCalledWith({
      businessId: 'business-1',
      invoiceId: 'invoice-recent-sync',
      refreshRemote: true,
    });

    unmount();
  });

  it('deduplica intentos recientes usando sessionStorage', async () => {
    const invoice = makeInvoice({
      id: 'invoice-deduped',
      lastSyncAt: BASE_NOW - MIN_REMOTE_REFRESH_INTERVAL_MS,
    });
    const key = sessionKeyFor(invoice);
    window.sessionStorage.setItem(
      key,
      String(BASE_NOW - SESSION_REFRESH_INTERVAL_MS + 1),
    );

    const { unmount } = renderHook(() =>
      usePendingElectronicTaxReceiptAutoRefresh({
        invoices: [makeRecord(invoice)],
      }),
    );

    await flushRefreshQueue();

    expect(window.sessionStorage.getItem(key)).toBe(
      String(BASE_NOW - SESSION_REFRESH_INTERVAL_MS + 1),
    );
    expect(mocks.fbRefreshElectronicTaxReceiptStatus).not.toHaveBeenCalled();

    unmount();
  });

  it('limita cada pasada a 5 refrescos', async () => {
    const invoices = Array.from({ length: 7 }, (_, index) =>
      makeInvoice({
        id: `invoice-${index + 1}`,
        lastSyncAt: BASE_NOW - MIN_REMOTE_REFRESH_INTERVAL_MS,
      }),
    );

    const { unmount } = renderHook(() =>
      usePendingElectronicTaxReceiptAutoRefresh({
        invoices: invoices.map(makeRecord),
      }),
    );

    await flushRefreshQueue();

    expect(mocks.fbRefreshElectronicTaxReceiptStatus).toHaveBeenCalledTimes(5);
    expect(
      mocks.fbRefreshElectronicTaxReceiptStatus.mock.calls.map(
        ([input]) => input.invoiceId,
      ),
    ).toEqual(['invoice-1', 'invoice-2', 'invoice-3', 'invoice-4', 'invoice-5']);
    expect(window.sessionStorage.getItem(sessionKeyFor(invoices[4]))).toBe(
      String(BASE_NOW),
    );
    expect(window.sessionStorage.getItem(sessionKeyFor(invoices[5]))).toBeNull();

    unmount();
  });

  it('no refresca estados terminales', async () => {
    const terminalStatuses = [
      'accepted',
      'accepted_conditional',
      'rejected',
      'error',
      'failed',
      'local_failed',
    ];
    const invoices = terminalStatuses.map((status) =>
      makeRecord(
        makeInvoice({
          id: `invoice-${status}`,
          lastSyncAt: BASE_NOW - MIN_REMOTE_REFRESH_INTERVAL_MS,
          status,
        }),
      ),
    );

    const { unmount } = renderHook(() =>
      usePendingElectronicTaxReceiptAutoRefresh({
        invoices,
      }),
    );

    await flushRefreshQueue();

    expect(mocks.fbRefreshElectronicTaxReceiptStatus).not.toHaveBeenCalled();

    unmount();
  });
});
