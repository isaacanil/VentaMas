import { fireEvent, render, screen } from '@testing-library/react';
import { Button, Form } from 'antd';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useComboComponentOptions,
  type ComboComponentProductOption,
} from '@/firebase/products/useComboComponentOptions';
import type { ProductRecord } from '@/types/products';

import { ComboRecipeEditor } from './ComboRecipeEditor';

vi.mock('@/firebase/products/useComboComponentOptions', () => ({
  useComboComponentOptions: vi.fn(),
}));

const useComboComponentOptionsMock = vi.mocked(useComboComponentOptions);

const productOption = ({
  id,
  name,
  stock,
  unitCost,
}: {
  id: string;
  name: string;
  stock: number;
  unitCost: number;
}): ComboComponentProductOption => ({
  label: name,
  product: {
    id,
    itemType: 'product',
    name,
    pricing: {
      cost: unitCost,
    },
    stock,
  } as ProductRecord,
  productId: id,
  productName: name,
  stock,
  unitCost,
  value: id,
});

const DEFAULT_OPTIONS = [
  productOption({
    id: 'coffee',
    name: 'Cafe',
    stock: 10,
    unitCost: 75,
  }),
  productOption({
    id: 'milk',
    name: 'Leche',
    stock: 8,
    unitCost: 25,
  }),
];

const renderWithForm = ({
  businessId = 'business-1',
  initialValues = {},
}: {
  businessId?: string | null;
  initialValues?: Record<string, unknown>;
} = {}) => {
  const Wrapper = () => {
    const [form] = Form.useForm();

    return (
      <Form form={form} initialValues={initialValues}>
        <ComboRecipeEditor
          businessId={businessId}
          currentProductId="combo-1"
        />
        <Button htmlType="submit">Guardar</Button>
      </Form>
    );
  };

  render(<Wrapper />);
};

describe('ComboRecipeEditor', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra estado vacio y bloquea agregar componentes sin negocio activo', () => {
    useComboComponentOptionsMock.mockReturnValue({
      businessId: null,
      error: null,
      loading: false,
      options: [],
    });

    renderWithForm({ businessId: null });

    expect(
      screen.getByText(
        'No se pudo determinar el negocio activo para listar productos.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('No hay productos en la receta.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Agregar producto/i }),
    ).toBeDisabled();
  });

  it('calcula costo estimado y muestra metadata de componentes existentes', () => {
    useComboComponentOptionsMock.mockReturnValue({
      businessId: 'business-1',
      error: null,
      loading: false,
      options: DEFAULT_OPTIONS,
    });

    renderWithForm({
      initialValues: {
        combo: {
          components: [
            {
              id: 'component-1',
              productId: 'coffee',
              quantity: 2,
            },
          ],
          inventoryPolicy: 'components',
        },
      },
    });

    expect(screen.getByText('Componente 1')).toBeInTheDocument();
    expect(screen.getByText('Stock: 10')).toBeInTheDocument();
    expect(screen.getByText('Costo: RD$75.00')).toBeInTheDocument();
    expect(screen.getByText('RD$150.00')).toBeInTheDocument();
  });

  it('bloquea agregar componentes mientras carga opciones disponibles', () => {
    useComboComponentOptionsMock.mockReturnValue({
      businessId: 'business-1',
      error: null,
      loading: true,
      options: [],
    });

    renderWithForm({ businessId: 'business-1' });

    expect(
      screen.getByText('Cargando productos disponibles...'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Agregar producto/i }),
    ).toBeDisabled();
  });

  it('muestra advertencia cuando falla la carga de opciones', () => {
    useComboComponentOptionsMock.mockReturnValue({
      businessId: 'business-1',
      error: new Error('load failed'),
      loading: false,
      options: [],
    });

    renderWithForm({ businessId: 'business-1' });

    expect(
      screen.getByText('No se pudieron cargar los productos disponibles.'),
    ).toBeInTheDocument();
  });

  it('valida que la receta tenga al menos un componente', async () => {
    useComboComponentOptionsMock.mockReturnValue({
      businessId: 'business-1',
      error: null,
      loading: false,
      options: DEFAULT_OPTIONS,
    });

    renderWithForm();

    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(
      await screen.findByText('Agrega al menos un producto al combo.'),
    ).toBeInTheDocument();
  });

});
