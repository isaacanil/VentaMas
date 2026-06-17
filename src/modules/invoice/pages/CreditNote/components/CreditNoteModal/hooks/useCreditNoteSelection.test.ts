import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useCreditNoteSelection } from './useCreditNoteSelection';
import type { InvoiceProduct } from '@/types/invoice';

type CreditNoteProduct = InvoiceProduct & { maxAvailableQty?: number };

const availableInvoiceItems: CreditNoteProduct[] = [
  { id: 'item-1', name: 'Alpha', maxAvailableQty: 3 },
  { id: 'item-2', name: 'Beta', maxAvailableQty: 2 },
];

const createProps = (
  overrides: Partial<Parameters<typeof useCreditNoteSelection>[0]> = {},
): Parameters<typeof useCreditNoteSelection>[0] => ({
  isOpen: true,
  mode: 'create',
  creditNoteData: null,
  selectedInvoiceId: 'invoice-1',
  availableInvoiceItems,
  existingItemQuantities: {},
  clientsLoading: false,
  invoicesLoading: false,
  ...overrides,
});

describe('useCreditNoteSelection', () => {
  it('auto-selects available items when creating a credit note', () => {
    const { result } = renderHook((props) => useCreditNoteSelection(props), {
      initialProps: createProps(),
    });

    expect(result.current.selectedItems).toEqual(['item-1', 'item-2']);
    expect(result.current.itemQuantities).toEqual({
      'item-1': 3,
      'item-2': 2,
    });
    expect(result.current.selectAll).toBe(true);
  });

  it('preserves local quantity, search, and selection across equivalent rerenders', () => {
    const initialProps = createProps();
    const { result, rerender } = renderHook(
      (props) => useCreditNoteSelection(props),
      {
        initialProps,
      },
    );

    act(() => {
      result.current.handleSearchTextChange('alp');
      result.current.handleItemChange('item-2', false);
      result.current.setItemQuantities((previous) => ({
        ...previous,
        'item-1': 1,
      }));
    });

    rerender(
      createProps({
        availableInvoiceItems: availableInvoiceItems.map((item) => ({
          ...item,
        })),
        existingItemQuantities: {},
        clientsLoading: true,
        invoicesLoading: true,
      }),
    );
    rerender(
      createProps({
        availableInvoiceItems: availableInvoiceItems.map((item) => ({
          ...item,
        })),
        existingItemQuantities: {},
      }),
    );

    expect(result.current.searchText).toBe('alp');
    expect(result.current.selectedItems).toEqual(['item-1']);
    expect(result.current.itemQuantities).toEqual({ 'item-1': 1 });
  });
});
