import { describe, expect, it } from 'vitest';

import {
  buildInitialCreditNoteSelection,
  createCreditNoteSelectionTargetKey,
  getCreditNoteLineKey,
} from './useCreditNoteSelection.helpers';
import type { CreditNoteRecord } from '@/types/creditNote';
import type { InvoiceProduct } from '@/types/invoice';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };

const invoiceItems: CreditNoteProduct[] = [
  { id: 'item-1', name: 'Primer item', maxAvailableQty: 3 },
  { id: 'item-2', name: 'Segundo item', maxAvailableQty: 2 },
];

describe('CreditNoteModal selection helpers', () => {
  it('keeps create mode auto-selecting available invoice items', () => {
    const selection = buildInitialCreditNoteSelection({
      isOpen: true,
      mode: 'create',
      creditNoteData: null,
      selectedInvoiceId: 'invoice-1',
      availableInvoiceItems: invoiceItems,
      existingItemQuantities: { 'item-2': 1 },
      clientsLoading: false,
      invoicesLoading: false,
    });

    expect(selection.selectedItems).toEqual(['item-1', 'item-2']);
    expect(selection.itemQuantities).toEqual({
      'item-1': 3,
      'item-2': 1,
    });
    expect(selection.selectAll).toBe(true);
  });

  it('builds edit/view selection from the credit note instead of the invoice', () => {
    const creditNoteData: CreditNoteRecord = {
      id: 'credit-note-1',
      invoiceId: 'invoice-1',
      items: [{ id: 'item-2', amountToBuy: 2 }],
    };

    const selection = buildInitialCreditNoteSelection({
      isOpen: true,
      mode: 'edit',
      creditNoteData,
      selectedInvoiceId: 'invoice-1',
      availableInvoiceItems: invoiceItems,
      existingItemQuantities: {},
      clientsLoading: true,
      invoicesLoading: true,
    });

    expect(selection.selectedItems).toEqual(['item-2']);
    expect(selection.itemQuantities).toEqual({ 'item-2': 2 });
    expect(selection.selectAll).toBe(false);
  });

  it('builds edit/view selection from sold weight for weighted credit note items', () => {
    const creditNoteData: CreditNoteRecord = {
      id: 'credit-note-weight',
      invoiceId: 'invoice-1',
      items: [
        {
          id: 'item-weight',
          amountToBuy: 1,
          weightDetail: {
            isSoldByWeight: true,
            weight: 0.75,
          },
        },
      ],
    };

    const selection = buildInitialCreditNoteSelection({
      isOpen: true,
      mode: 'edit',
      creditNoteData,
      selectedInvoiceId: 'invoice-1',
      availableInvoiceItems: invoiceItems,
      existingItemQuantities: {},
      clientsLoading: true,
      invoicesLoading: true,
    });

    expect(selection.selectedItems).toEqual(['item-weight']);
    expect(selection.itemQuantities).toEqual({ 'item-weight': 0.75 });
  });

  it('uses line keys before product ids so repeated products stay independent', () => {
    const duplicateProductItems: CreditNoteProduct[] = [
      { id: 'product-1', cid: 'product-1', name: 'Unidad', maxAvailableQty: 1 },
      {
        id: 'product-1',
        cid: 'product-1::sale-unit::box',
        name: 'Caja',
        maxAvailableQty: 2,
      },
    ];

    const selection = buildInitialCreditNoteSelection({
      isOpen: true,
      mode: 'create',
      creditNoteData: null,
      selectedInvoiceId: 'invoice-1',
      availableInvoiceItems: duplicateProductItems,
      existingItemQuantities: { 'product-1::sale-unit::box': 1 },
      clientsLoading: false,
      invoicesLoading: false,
    });

    expect(duplicateProductItems.map(getCreditNoteLineKey)).toEqual([
      'product-1',
      'product-1::sale-unit::box',
    ]);
    expect(selection.selectedItems).toEqual([
      'product-1',
      'product-1::sale-unit::box',
    ]);
    expect(selection.itemQuantities).toEqual({
      'product-1': 1,
      'product-1::sale-unit::box': 1,
    });
  });

  it('keeps the target key stable across equivalent credit note objects', () => {
    const firstCreditNote: CreditNoteRecord = {
      id: 'credit-note-1',
      invoiceId: 'invoice-1',
      items: [{ id: 'item-1', amountToBuy: 1 }],
    };
    const nextCreditNote: CreditNoteRecord = {
      ...firstCreditNote,
      items: [{ id: 'item-1', amountToBuy: 3 }],
    };

    expect(
      createCreditNoteSelectionTargetKey({
        isOpen: true,
        mode: 'edit',
        creditNoteData: firstCreditNote,
        selectedInvoiceId: 'invoice-1',
      }),
    ).toBe(
      createCreditNoteSelectionTargetKey({
        isOpen: true,
        mode: 'edit',
        creditNoteData: nextCreditNote,
        selectedInvoiceId: 'invoice-1',
      }),
    );
  });
});
