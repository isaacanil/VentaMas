import {
  DeleteOutlined,
  PlusOutlined,
  ShoppingOutlined,
} from '@/constants/icons/antd';
import { Button, Card, Form, Input, InputNumber, Select, Switch } from 'antd';
import { nanoid } from 'nanoid';
import styled from 'styled-components';

import { shouldSelectZeroPriceInput } from '@/domain/products/priceInputFocus';
import { initTaxes, taxLabel } from '@/domain/products/productDefaults';
import { normalizeProductPricingCurrency } from '@/domain/products/pricingForm';
import type { FocusEvent } from 'react';
import type { ProductRecord } from '@/types/products';

type SaleUnitsInfoProps = {
  pricing?: ProductRecord['pricing'];
};

const TAX_OPTIONS = initTaxes.map((tax) => ({
  value: tax,
  label: taxLabel(tax),
}));

const createSaleUnit = (pricing?: ProductRecord['pricing']) => ({
  id: nanoid(),
  unitName: '',
  quantity: 1,
  conversionFactorToBase: 1,
  allowFractional: false,
  active: true,
  pricing: {
    currency: normalizeProductPricingCurrency(pricing?.currency),
    listPrice: 0,
    price: 0,
    tax: pricing?.tax ?? 0,
  },
});

const handlePriceNumberFocus = (event: FocusEvent<HTMLInputElement>) => {
  if (!shouldSelectZeroPriceInput(event.currentTarget.value)) {
    return;
  }
  event.currentTarget.select();
};

export const SaleUnitsInfo = ({ pricing }: SaleUnitsInfoProps) => (
  <Card title="Presentaciones de venta" size="small">
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

              <UnitGrid>
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
              </UnitGrid>

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
            </UnitRow>
          ))}

          <Button
            type="dashed"
            icon={<PlusOutlined />}
            onClick={() => add(createSaleUnit(pricing))}
          >
            Agregar presentación
          </Button>
        </UnitsStack>
      )}
    </Form.List>
  </Card>
);

const UnitsStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const UnitRow = styled.div`
  padding: 14px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
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

const UnitGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px 16px;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
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
  padding: 16px;
  color: #64748b;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
`;
