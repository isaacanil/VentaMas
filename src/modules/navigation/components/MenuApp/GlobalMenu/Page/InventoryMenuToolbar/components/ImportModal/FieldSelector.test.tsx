import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import FieldSelector from './FieldSelector';

const essentialFields = ['Nombre'];
const optionalGroups = {
  Precios: ['Impuesto', 'Descuento'],
  Visualizacion: ['Imagen'],
};

describe('FieldSelector', () => {
  it('notifies the parent only when optional fields change', () => {
    const onFieldsChange = vi.fn();

    render(
      <FieldSelector
        essentialFields={essentialFields}
        optionalGroups={optionalGroups}
        onFieldsChange={onFieldsChange}
      />,
    );

    expect(onFieldsChange).not.toHaveBeenCalled();

    fireEvent.click(screen.getByLabelText('Impuesto'));

    expect(onFieldsChange).toHaveBeenCalledTimes(1);
    expect(onFieldsChange).toHaveBeenLastCalledWith(['Impuesto']);
  });

  it('selects and clears all optional fields from the flattened groups', () => {
    const onFieldsChange = vi.fn();

    render(
      <FieldSelector
        essentialFields={essentialFields}
        optionalGroups={optionalGroups}
        onFieldsChange={onFieldsChange}
      />,
    );

    fireEvent.click(screen.getByLabelText('Seleccionar todos'));

    expect(onFieldsChange).toHaveBeenCalledTimes(1);
    expect(onFieldsChange).toHaveBeenLastCalledWith([
      'Impuesto',
      'Descuento',
      'Imagen',
    ]);

    fireEvent.click(screen.getByLabelText('Seleccionar todos'));

    expect(onFieldsChange).toHaveBeenCalledTimes(2);
    expect(onFieldsChange).toHaveBeenLastCalledWith([]);
  });
});
