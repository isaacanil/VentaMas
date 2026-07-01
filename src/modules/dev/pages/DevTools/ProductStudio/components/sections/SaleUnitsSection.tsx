import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingOutlined,
} from '@/constants/icons/antd';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Typography,
} from 'antd';
import { nanoid } from 'nanoid';
import styled from 'styled-components';

import {
  normalizeProductPricingCurrency,
  type ProductPricingFormValues,
} from '@/domain/products/pricingForm';
import { shouldSelectZeroPriceInput } from '@/domain/products/priceInputFocus';
import { initTaxes, taxLabel } from '@/domain/products/productDefaults';
import {
  FieldGrid,
  SectionCard,
  SectionDescription,
  SectionHeader,
  SectionTitle,
} from '@/modules/dev/pages/DevTools/ProductStudio/components/SectionLayout';
import type { FocusEvent } from 'react';

const { Text } = Typography;

interface SaleUnitsSectionProps {
  domId: string;
  pricingValues?: ProductPricingFormValues;
}

const TAX_OPTIONS = initTaxes.map((tax) => ({
  value: tax,
  label: taxLabel(tax),
}));

const handlePriceNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
  if (!shouldSelectZeroPriceInput(event.currentTarget.value)) {
    return;
  }
  event.currentTarget.select();
};

const UnitsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UnitRow = styled.div`
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
`;

const UnitRowHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const UnitTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  color: #0f172a;
`;

const SwitchGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`;

const SwitchItem = styled(Form.Item)`
  margin-bottom: 0 !important;

  .ant-form-item-row {
    align-items: center;
  }
`;

const EmptyState = styled.div`
  padding: 18px;
  color: #64748b;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-start;
`;

const createSaleUnit = (pricingValues?: ProductPricingFormValues) => ({
  id: nanoid(),
  unitName: '',
  quantity: 1,
  conversionFactorToBase: 1,
  allowFractional: false,
  active: true,
  pricing: {
    currency: normalizeProductPricingCurrency(pricingValues?.currency),
    listPrice: 0,
    price: 0,
    tax: pricingValues?.tax ?? 0,
  },
});

export const SaleUnitsSection = ({
  domId,
  pricingValues,
}: SaleUnitsSectionProps) => (
  <SectionCard id={domId}>
    <SectionHeader>
      <SectionTitle level={4}>Presentaciones de venta</SectionTitle>
      <SectionDescription>
        Define cajas, paquetes o formatos que descuentan inventario base.
      </SectionDescription>
    </SectionHeader>

    <Form.List name="saleUnits">
      {(fields, { add, remove }) => (
        <UnitsStack>
          {fields.length === 0 ? (
            <EmptyState>No hay presentaciones configuradas.</EmptyState>
          ) : null}

          {fields.map(({ key, name, ...restField }, index) => (
            <UnitRow key={key}>
              <Form.Item {...restField} name={[name, 'id']} hidden>
                <Input />
              </Form.Item>
              <UnitRowHeader>
                <UnitTitle>
                  <ShoppingOutlined />
                  <span>Presentación {index + 1}</span>
                </UnitTitle>
                <Button
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => remove(name)}
                  aria-label={`Eliminar presentación ${index + 1}`}
                />
              </UnitRowHeader>

              <FieldGrid>
                <Form.Item
                  {...restField}
                  name={[name, 'unitName']}
                  label="Nombre"
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: 'Indica el nombre de la presentación.',
                    },
                  ]}
                >
                  <Input placeholder="Caja" />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, 'conversionFactorToBase']}
                  label="Unidades base"
                  tooltip="Cantidad de unidades base que se descuentan por cada presentación vendida."
                  rules={[
                    {
                      required: true,
                      message: 'Indica cuántas unidades descuenta.',
                    },
                    {
                      validator(_, value) {
                        if (Number(value) > 0) return Promise.resolve();
                        return Promise.reject(
                          new Error('Debe ser mayor que cero.'),
                        );
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0.000001}
                    step={1}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, 'pricing', 'listPrice']}
                  label="Precio"
                  rules={[
                    {
                      required: true,
                      message: 'Indica el precio de venta.',
                    },
                    {
                      validator(_, value) {
                        if (Number(value) > 0) return Promise.resolve();
                        return Promise.reject(
                          new Error('El precio debe ser mayor que cero.'),
                        );
                      },
                    },
                  ]}
                >
                  <InputNumber
                    min={0.000001}
                    onFocus={handlePriceNumberFocus}
                    style={{ width: '100%' }}
                  />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, 'pricing', 'tax']}
                  label="ITBIS %"
                  rules={[{ required: true, message: 'Selecciona el ITBIS.' }]}
                >
                  <Select options={TAX_OPTIONS} popupMatchSelectWidth={false} />
                </Form.Item>

                <Form.Item
                  {...restField}
                  name={[name, 'barcode']}
                  label="Código de barras"
                >
                  <Input />
                </Form.Item>

                <SwitchGrid>
                  <SwitchItem
                    {...restField}
                    name={[name, 'active']}
                    label="Activa"
                    valuePropName="checked"
                  >
                    <Switch />
                  </SwitchItem>
                  <SwitchItem
                    {...restField}
                    name={[name, 'allowFractional']}
                    label="Fraccionable"
                    valuePropName="checked"
                  >
                    <Switch />
                  </SwitchItem>
                </SwitchGrid>
              </FieldGrid>
            </UnitRow>
          ))}

          <ActionsRow>
            <Button
              type="dashed"
              icon={<PlusOutlined />}
              onClick={() => add(createSaleUnit(pricingValues))}
            >
              Agregar presentación
            </Button>
          </ActionsRow>

          <Text type="secondary">
            El stock sigue guardándose en unidades base; cada presentación
            calcula cuánto debe descontar.
          </Text>
        </UnitsStack>
      )}
    </Form.List>
  </SectionCard>
);
