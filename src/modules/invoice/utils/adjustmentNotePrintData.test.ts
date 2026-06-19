import { describe, expect, it } from 'vitest';

import {
  creditNoteToInvoicePrintData,
  debitNoteToInvoicePrintData,
} from '@/modules/invoice/utils/adjustmentNotePrintData';
import { resolveDocumentIdentity } from '@/utils/invoice/documentIdentity';

describe('adjustmentNotePrintData', () => {
  it('adapts credit notes to the shared invoice print shape', () => {
    const printData = creditNoteToInvoicePrintData({
      id: 'credit-1',
      numberID: 12,
      eNcf: 'E340000000001',
      client: { name: 'GI SYS SRL', rnc: '132619201' },
      invoiceNcf: 'E310000000001',
      modificationCode: '3',
      reason: 'Devolución parcial',
      totalAmount: 118,
      items: [
        {
          id: 'line-1',
          name: 'Producto devuelto',
          amountToBuy: 1,
          pricing: { price: 100, tax: 18 },
        },
      ],
      electronicTaxReceipt: {
        documentType: 'E34',
        eNcf: 'E340000000001',
        securityCode: 'ABC123',
      },
    });

    expect(resolveDocumentIdentity(printData)).toMatchObject({
      title: 'NOTA DE CRÉDITO ELECTRÓNICA',
      type: 'fiscal-credit-note',
    });
    expect(printData.totalPurchase).toEqual({ value: 118 });
    expect(printData.totalTaxes).toEqual({ value: 18 });
    expect(printData.invoiceComment).toContain(
      'Documento afectado: E310000000001',
    );
    expect(printData.invoiceComment).toContain('Motivo: Devolución parcial');
  });

  it('creates a printable summary line for debit notes without items', () => {
    const printData = debitNoteToInvoicePrintData({
      id: 'debit-1',
      numberID: 15,
      totalAmount: 118,
      taxAmount: 18,
      invoiceNumber: 720,
      reason: 'Ajuste de precio',
      electronicTaxReceipt: {
        documentType: 'E33',
        eNcf: 'E330000000001',
      },
      items: [],
    });

    expect(resolveDocumentIdentity(printData)).toMatchObject({
      title: 'NOTA DE DÉBITO ELECTRÓNICA',
      type: 'fiscal-debit-note',
    });
    expect(printData.products).toHaveLength(1);
    expect(printData.products?.[0]?.name).toBe(
      'Nota de débito: Ajuste de precio',
    );
    expect(printData.totalPurchaseWithoutTaxes).toEqual({ value: 100 });
    expect(printData.totalTaxes).toEqual({ value: 18 });
  });
});
