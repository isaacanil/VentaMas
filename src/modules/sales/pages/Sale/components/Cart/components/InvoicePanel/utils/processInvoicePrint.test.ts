import { notification } from 'antd';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { downloadInvoicePdf } from '@/firebase/quotation/downloadQuotationPDF';

import { processInvoicePrint } from './processInvoicePrint';

vi.mock('@/firebase/quotation/downloadQuotationPDF', () => ({
  downloadInvoicePdf: vi.fn(),
}));

vi.mock('@/utils/perf/measure', () => ({
  measure: vi.fn((_label: string, callback: () => unknown) => callback()),
}));

vi.mock('antd', () => ({
  notification: {
    error: vi.fn(),
  },
}));

const createArgs = () => ({
  business: { id: 'business-1' },
  handleAfterPrint: vi.fn(),
  invoice: { id: 'invoice-1', products: [] },
  invoiceType: 'template1',
  setPendingPrint: vi.fn(),
});

describe('processInvoicePrint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates HTML templates to react-to-print', async () => {
    const args = createArgs();

    await processInvoicePrint(args);

    expect(args.setPendingPrint).toHaveBeenCalledWith(true);
    expect(args.handleAfterPrint).not.toHaveBeenCalled();
    expect(downloadInvoicePdf).not.toHaveBeenCalled();
  });

  it('finalizes the sale UI after dispatching a PDF print', async () => {
    const args = { ...createArgs(), invoiceType: 'template2' };
    vi.mocked(downloadInvoicePdf).mockResolvedValue(undefined);

    await processInvoicePrint(args);

    expect(downloadInvoicePdf).toHaveBeenCalledWith(
      expect.objectContaining({
        business: args.business,
        data: args.invoice,
        invoiceType: 'template2',
        onDialogClose: args.handleAfterPrint,
      }),
    );
    expect(args.setPendingPrint).not.toHaveBeenCalled();
    expect(args.handleAfterPrint).toHaveBeenCalledTimes(1);
  });

  it('finalizes the sale UI after a PDF print failure notification', async () => {
    const args = { ...createArgs(), invoiceType: 'template2' };
    vi.mocked(downloadInvoicePdf).mockRejectedValue(new Error('PDF failed'));

    await processInvoicePrint(args);

    expect(notification.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Error al imprimir',
        description: 'No se pudo generar el PDF: PDF failed',
      }),
    );
    expect(args.handleAfterPrint).toHaveBeenCalledTimes(1);
  });
});
