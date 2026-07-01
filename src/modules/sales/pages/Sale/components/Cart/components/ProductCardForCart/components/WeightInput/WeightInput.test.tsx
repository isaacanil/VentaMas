import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { changeProductWeight } from '@/features/cart/cartSlice';
import { WeightInput } from './WeightInput';

const dispatchMock = vi.hoisted(() => vi.fn());

vi.mock('react-redux', () => ({
  useDispatch: () => dispatchMock,
}));

describe('WeightInput', () => {
  it('reflects external weight changes while the field is not focused', () => {
    const { rerender } = render(
      <WeightInput
        item={{
          cid: 'line-1',
          weightDetail: {
            weight: 1.25,
            weightUnit: 'lb',
          },
        }}
      />,
    );

    const input = screen.getByLabelText('Peso vendido (lb)');

    expect(input).toHaveValue('1.25');

    rerender(
      <WeightInput
        item={{
          cid: 'line-1',
          weightDetail: {
            weight: 2.5,
            weightUnit: 'lb',
          },
        }}
      />,
    );

    expect(input).toHaveValue('2.5');
  });

  it('allows clearing the focused field and commits the default weight on blur', () => {
    render(
      <WeightInput
        item={{
          cid: 'line-1',
          restrictSaleWithoutStock: true,
          stock: 12,
          weightDetail: {
            weight: 1.25,
            weightUnit: 'lb',
          },
        }}
      />,
    );

    const input = screen.getByLabelText('Peso vendido (lb)');

    expect(input).toHaveValue('1.25');

    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: '' } });

    expect(input).toHaveValue('');
    expect(dispatchMock).not.toHaveBeenCalled();

    fireEvent.blur(input);

    expect(input).toHaveValue('1');
    expect(dispatchMock).toHaveBeenCalledWith(
      changeProductWeight({ id: 'line-1', weight: 1 }),
    );
  });
});
