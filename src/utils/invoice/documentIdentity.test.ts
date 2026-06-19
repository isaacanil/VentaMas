import { describe, expect, it } from 'vitest';

import {
  isPreorderDocument,
  resolveDocumentIdentity,
  resolveDocumentNumberLine,
} from '@/utils/invoice/documentIdentity';

describe('isPreorderDocument', () => {
  it('treats corrupted boolean status as preorder when invoice is marked as preorder and has no NCF', () => {
    expect(
      isPreorderDocument({
        type: 'preorder',
        // legacy corrupted status
        status: true as any,
        preorderDetails: { isOrWasPreorder: true, numberID: 123 },
        NCF: '',
      }),
    ).toBe(true);
  });

  it('does not treat completed docs as preorder', () => {
    expect(
      isPreorderDocument({
        type: 'preorder',
        status: 'completed',
        preorderDetails: { isOrWasPreorder: true, numberID: 123 },
        NCF: '',
      }),
    ).toBe(false);
  });

  it('resolves electronic fiscal document identity from e-NCF', () => {
    expect(
      resolveDocumentIdentity({
        electronicTaxReceipt: {
          eNcf: 'E320000000001',
          documentType: 'E32',
        },
      }),
    ).toMatchObject({
      title: 'FACTURA DE CONSUMO ELECTRÓNICA',
      label: 'e-NCF',
      value: 'E320000000001',
      type: 'fiscal-consumer',
    });
  });

  it('does not fall back to payment receipt when e-CF is pending without e-NCF', () => {
    expect(
      resolveDocumentIdentity({
        documentFormat: 'electronic',
        electronicTaxReceipt: {
          status: 'shadow_ready',
          documentType: 'E31',
        },
      }),
    ).toMatchObject({
      title: 'FACTURA DE CRÉDITO FISCAL ELECTRÓNICA',
      label: 'e-NCF',
      value: null,
      type: 'fiscal-credit',
    });
  });

  it('resolves electronic adjustment note identities from document type', () => {
    expect(
      resolveDocumentIdentity({
        electronicTaxReceipt: { documentType: 'E33' },
      }),
    ).toMatchObject({
      title: 'NOTA DE DÉBITO ELECTRÓNICA',
      label: 'e-NCF',
      value: null,
      type: 'fiscal-debit-note',
    });

    expect(
      resolveDocumentIdentity({
        electronicTaxReceipt: { documentType: 'E34' },
      }),
    ).toMatchObject({
      title: 'NOTA DE CRÉDITO ELECTRÓNICA',
      label: 'e-NCF',
      value: null,
      type: 'fiscal-credit-note',
    });
  });

  it('resolves governmental e-CF identity', () => {
    expect(
      resolveDocumentIdentity({
        electronicTaxReceipt: {
          eNcf: 'E450000000001',
          documentType: 'E45',
        },
      }),
    ).toMatchObject({
      title: 'COMPROBANTE GUBERNAMENTAL ELECTRÓNICO',
      label: 'e-NCF',
      value: 'E450000000001',
      type: 'fiscal-government',
    });
  });

  it('uses adjustment note labels for the visible document number line', () => {
    const creditNoteIdentity = resolveDocumentIdentity({
      numberID: 704,
      electronicTaxReceipt: {
        eNcf: 'E340000000001',
        documentType: 'E34',
      },
    });
    const debitNoteIdentity = resolveDocumentIdentity({
      numberID: 705,
      electronicTaxReceipt: {
        eNcf: 'E330000000001',
        documentType: 'E33',
      },
    });

    expect(
      resolveDocumentNumberLine(creditNoteIdentity, { numberID: 704 }),
    ).toBe('Nota de crédito #704');
    expect(
      resolveDocumentNumberLine(debitNoteIdentity, { numberID: 705 }),
    ).toBe('Nota de débito #705');
  });
});
