import { beforeEach, describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => firestoreMocks.collection(...args),
  doc: (...args: unknown[]) => firestoreMocks.doc(...args),
  getDoc: (...args: unknown[]) => firestoreMocks.getDoc(...args),
  getDocs: (...args: unknown[]) => firestoreMocks.getDocs(...args),
  limit: (...args: unknown[]) => firestoreMocks.limit(...args),
  onSnapshot: (...args: unknown[]) => firestoreMocks.onSnapshot(...args),
  query: (...args: unknown[]) => firestoreMocks.query(...args),
  where: (...args: unknown[]) => firestoreMocks.where(...args),
}));

vi.mock('firebase/functions', () => ({
  httpsCallable: vi.fn(() => vi.fn()),
}));

vi.mock('@/firebase/firebaseconfig', () => ({
  db: { app: 'test-db' },
  functions: { app: 'test-functions' },
}));

vi.mock('@/utils/accounting/monetary', () => ({
  getAccountingSettingsForBusiness: vi.fn(),
  resolveMonetarySnapshotForBusiness: vi.fn(),
}));

vi.mock('@/utils/payments/methods', () => ({
  paymentMethodRequiresBankAccount: vi.fn(() => false),
}));

vi.mock('@/utils/payments/bankPaymentPolicy', () => ({
  resolveEffectiveBankAccountId: vi.fn(() => null),
}));

import { waitForInvoiceResult } from '@/services/invoice/invoice.service';

type MockDocumentReference = {
  path: string;
};

type MockDocumentSnapshot = {
  exists: () => boolean;
  data: () => Record<string, unknown>;
};

type SnapshotHandler = (snapshot: MockDocumentSnapshot) => void;
type SnapshotErrorHandler = (error: unknown) => void;

const makeDocumentSnapshot = (
  data: Record<string, unknown> | null,
): MockDocumentSnapshot => ({
  exists: () => Boolean(data),
  data: () => data ?? {},
});

const makeDocumentReference = (...args: unknown[]): MockDocumentReference => ({
  path: args.slice(1).join('/'),
});

describe('waitForInvoiceResult', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    firestoreMocks.doc.mockImplementation(makeDocumentReference);
  });

  it.each(['frontend_ready', 'print_ready'])(
    'resuelve %s desde el listener como estado imprimible',
    async (status) => {
      firestoreMocks.onSnapshot.mockImplementation(
        (
          ref: MockDocumentReference,
          onNext: SnapshotHandler,
        ): (() => void) => {
          if (ref.path.includes('/invoicesV2/')) {
            onNext(makeDocumentSnapshot({ status }));
          } else {
            onNext(
              makeDocumentSnapshot({
                data: {
                  id: `invoice-${status}`,
                },
              }),
            );
          }

          return vi.fn();
        },
      );

      const result = await waitForInvoiceResult({
        businessId: 'business-1',
        invoiceId: `invoice-${status}`,
        timeoutMs: 100,
      });

      expect(result.invoice).toEqual({ id: `invoice-${status}` });
      expect(result.invoiceMeta).toMatchObject({ status });
      expect(firestoreMocks.getDoc).not.toHaveBeenCalled();
    },
  );

  it('resuelve print_ready_with_review por polling cuando el listener no esta disponible', async () => {
    firestoreMocks.onSnapshot.mockImplementation(
      (
        _ref: MockDocumentReference,
        _onNext: SnapshotHandler,
        onError: SnapshotErrorHandler,
      ): (() => void) => {
        onError(new Error('listener unavailable'));
        return vi.fn();
      },
    );
    firestoreMocks.getDoc.mockImplementation(
      async (ref: MockDocumentReference) => {
        if (ref.path.includes('/invoicesV2/')) {
          return makeDocumentSnapshot({ status: 'print_ready_with_review' });
        }
        if (ref.path.includes('/invoices/')) {
          return makeDocumentSnapshot({
            data: {
              id: 'invoice-review',
            },
          });
        }
        return makeDocumentSnapshot(null);
      },
    );

    const result = await waitForInvoiceResult({
      businessId: 'business-1',
      invoiceId: 'invoice-review',
      pollInterval: 1,
      timeoutMs: 100,
    });

    expect(result.invoice).toEqual({ id: 'invoice-review' });
    expect(result.invoiceMeta).toMatchObject({
      status: 'print_ready_with_review',
    });
    expect(firestoreMocks.getDoc).toHaveBeenCalledWith(
      expect.objectContaining({
        path: 'businesses/business-1/invoices/invoice-review',
      }),
    );
  });
});
