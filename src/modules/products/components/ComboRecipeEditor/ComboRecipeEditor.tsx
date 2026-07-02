import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@/constants/icons/antd';
import { matchesSelectOptionText } from '@/domain/products/selectOptionText';
import {
  useComboComponentOptions,
  type ComboComponentProductOption,
} from '@/firebase/products/useComboComponentOptions';
import type { ProductComboComponent } from '@/types/products';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
} from 'antd';
import { nanoid } from 'nanoid';
import { useMemo } from 'react';

import {
  CompactFormItem,
  ComponentGrid,
  ComponentMeta,
  ComponentRow,
  ComponentRowHeader,
  ComponentTitle,
  EditorCard,
  EmptyState,
  RecipeStack,
  SummaryRow,
} from './ComboRecipeEditor.styles';

const { Text } = Typography;

type ComboRecipeEditorProps = {
  businessId?: string | null;
  currentProductId?: string | null;
  title?: string;
};

const createComboComponent = (): ProductComboComponent => ({
  id: nanoid(),
  productId: '',
  quantity: 1,
});

const cleanString = (value: unknown): string => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('es-DO', {
    currency: 'DOP',
    maximumFractionDigits: 2,
    style: 'currency',
  }).format(value);

const resolveUnitName = (
  option: ComboComponentProductOption | undefined,
): string | null => {
  const selectedUnitName = option?.product.selectedSaleUnit?.unitName;
  if (selectedUnitName) return selectedUnitName;
  return option?.product.saleUnits?.[0]?.unitName || null;
};

export const ComboRecipeEditor = ({
  businessId,
  currentProductId,
  title = 'Receta del combo',
}: ComboRecipeEditorProps) => {
  const form = Form.useFormInstance();
  const watchedComponents = Form.useWatch(
    ['combo', 'components'],
    form,
  ) as ProductComboComponent[] | undefined;
  const { error, loading, options } = useComboComponentOptions(
    businessId,
    currentProductId,
  );

  const optionsById = useMemo(
    () => new Map(options.map((option) => [option.productId, option])),
    [options],
  );

  const selectedProductIds = useMemo(() => {
    const values = new Set<string>();
    if (!Array.isArray(watchedComponents)) return values;
    watchedComponents.forEach((component) => {
      const productId = cleanString(component?.productId);
      if (productId) values.add(productId);
    });
    return values;
  }, [watchedComponents]);

  const selectOptions = useMemo(
    () =>
      options.map((option) => ({
        label: option.productName,
        value: option.value,
      })),
    [options],
  );

  const estimatedCost = useMemo(() => {
    if (!Array.isArray(watchedComponents)) return 0;

    return watchedComponents.reduce((total, component) => {
      const productId = cleanString(component?.productId);
      const option = optionsById.get(productId);
      const quantity = Number(component?.quantity);
      if (!option || !Number.isFinite(quantity) || quantity <= 0) return total;
      return total + option.unitCost * quantity;
    }, 0);
  }, [optionsById, watchedComponents]);

  const buildOptionsForRow = (currentProductIdValue: unknown) => {
    const currentValue = cleanString(currentProductIdValue);
    return selectOptions.map((option) => ({
      ...option,
      disabled:
        selectedProductIds.has(option.value) && option.value !== currentValue,
    }));
  };

  const handleComponentProductChange = (
    fieldName: number,
    productId: string,
  ) => {
    const option = optionsById.get(productId);
    const basePath = ['combo', 'components', fieldName];

    form.setFieldValue([...basePath, 'productName'], option?.productName || '');
    form.setFieldValue([...basePath, 'sku'], option?.product.sku ?? null);
    form.setFieldValue([...basePath, 'unitName'], resolveUnitName(option));
  };

  const validateUniqueProduct = (_: unknown, value: unknown) => {
    const productId = cleanString(value);
    if (!productId) return Promise.resolve();
    const components = form.getFieldValue([
      'combo',
      'components',
    ]) as ProductComboComponent[] | undefined;
    const matches = Array.isArray(components)
      ? components.filter(
          (component) => cleanString(component?.productId) === productId,
        )
      : [];
    if (matches.length <= 1) return Promise.resolve();
    return Promise.reject(new Error('Este producto ya está en la receta.'));
  };

  const validateUniqueRecipeProducts = (
    _: unknown,
    components: ProductComboComponent[] = [],
  ) => {
    const seen = new Set<string>();
    for (const component of components) {
      const productId = cleanString(component?.productId);
      if (!productId) continue;
      if (seen.has(productId)) {
        return Promise.reject(
          new Error('No repitas productos en la receta.'),
        );
      }
      seen.add(productId);
    }
    return Promise.resolve();
  };

  const validatePositiveQuantity = (_: unknown, value: unknown) => {
    if (Number(value) > 0) return Promise.resolve();
    return Promise.reject(new Error('Debe ser mayor que cero.'));
  };

  return (
    <EditorCard title={title} size="small">
      <Form.Item
        name={['combo', 'inventoryPolicy']}
        initialValue="components"
        hidden
      >
        <Input />
      </Form.Item>

      {!businessId ? (
        <Alert
          type="warning"
          showIcon
          message="No se pudo determinar el negocio activo para listar productos."
        />
      ) : null}

      {error ? (
        <Alert
          type="warning"
          showIcon
          message="No se pudieron cargar los productos disponibles."
        />
      ) : null}

      <Form.List
        name={['combo', 'components']}
        rules={[
          {
            validator: async (_, components: ProductComboComponent[] = []) => {
              if (components.length > 0) return;
              throw new Error('Agrega al menos un producto al combo.');
            },
          },
          {
            validator: validateUniqueRecipeProducts,
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <RecipeStack>
            {fields.length === 0 ? (
              <EmptyState>
                {loading
                  ? 'Cargando productos disponibles...'
                  : 'No hay productos en la receta.'}
              </EmptyState>
            ) : null}

            {fields.map(({ key, name, ...restField }, index) => {
              const rowProductId = watchedComponents?.[name]?.productId;
              const rowOption = optionsById.get(cleanString(rowProductId));

              return (
                <ComponentRow key={key}>
                  <Form.Item {...restField} name={[name, 'id']} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[name, 'productName']}
                    hidden
                  >
                    <Input />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'sku']} hidden>
                    <Input />
                  </Form.Item>
                  <Form.Item {...restField} name={[name, 'unitName']} hidden>
                    <Input />
                  </Form.Item>

                  <ComponentRowHeader>
                    <ComponentTitle>
                      <ShoppingCartOutlined />
                      <span>Componente {index + 1}</span>
                    </ComponentTitle>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => remove(name)}
                      aria-label={`Eliminar componente ${index + 1}`}
                    />
                  </ComponentRowHeader>

                  <ComponentGrid>
                    <CompactFormItem
                      {...restField}
                      name={[name, 'productId']}
                      label="Producto"
                      rules={[
                        {
                          required: true,
                          message: 'Selecciona un producto.',
                        },
                        { validator: validateUniqueProduct },
                      ]}
                    >
                      <Select
                        showSearch
                        loading={loading}
                        placeholder="Selecciona un producto"
                        optionFilterProp="label"
                        options={buildOptionsForRow(rowProductId)}
                        filterOption={(inputValue, option) =>
                          matchesSelectOptionText(inputValue, option?.label)
                        }
                        notFoundContent={
                          loading
                            ? 'Cargando productos...'
                            : 'Sin productos disponibles'
                        }
                        onChange={(productId) =>
                          handleComponentProductChange(name, productId)
                        }
                      />
                    </CompactFormItem>

                    <CompactFormItem
                      {...restField}
                      name={[name, 'quantity']}
                      label="Cantidad"
                      rules={[
                        {
                          required: true,
                          message: 'Indica la cantidad.',
                        },
                        { validator: validatePositiveQuantity },
                      ]}
                    >
                      <InputNumber
                        min={0.000001}
                        step={1}
                        style={{ width: '100%' }}
                      />
                    </CompactFormItem>
                  </ComponentGrid>

                  {rowOption ? (
                    <ComponentMeta>
                      <Text type="secondary">Stock: {rowOption.stock}</Text>
                      <Text type="secondary">
                        Costo: {formatCurrency(rowOption.unitCost)}
                      </Text>
                    </ComponentMeta>
                  ) : null}
                </ComponentRow>
              );
            })}

            <Form.ErrorList errors={errors} />

            <SummaryRow>
              <Text strong>Costo estimado</Text>
              <Text>{formatCurrency(estimatedCost)}</Text>
            </SummaryRow>

            <Button
              type="dashed"
              icon={<PlusOutlined />}
              disabled={!businessId || loading}
              onClick={() => add(createComboComponent())}
            >
              Agregar producto
            </Button>
          </RecipeStack>
        )}
      </Form.List>
    </EditorCard>
  );
};
