import { describe, expect, it } from 'vitest';

import { OPERATION_MODES } from '@/constants/modes';

import modalReducer, { toggleClientModal } from './modalSlice';

describe('modalSlice client modal', () => {
  it('clears addClientToCart when the client modal closes and reopens normally', () => {
    const createMode = OPERATION_MODES.CREATE.id;

    let state = modalReducer(
      undefined,
      toggleClientModal({ mode: createMode, addClientToCart: true }),
    );
    expect(state.modalToggleClient).toMatchObject({
      isOpen: true,
      addClientToCart: true,
    });

    state = modalReducer(state, toggleClientModal({ mode: createMode }));
    expect(state.modalToggleClient).toMatchObject({
      isOpen: false,
      addClientToCart: false,
      data: null,
      mode: createMode,
    });

    state = modalReducer(state, toggleClientModal({ mode: createMode }));
    expect(state.modalToggleClient).toMatchObject({
      isOpen: true,
      addClientToCart: false,
    });
  });
});
