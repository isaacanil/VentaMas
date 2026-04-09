import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import React from 'react';

import { FormContainer, Grid } from './styles';

import type { SaleUnitFormValues } from './types';

const ConditionalPriceField = ({
  checkboxName,
  label,
  tooltip,
  priceName,
  message,
}: {
  checkboxName: 'listPriceEnabled' | 'avgPriceEnabled' | 'minPriceEnabled';
  label: string;
  tooltip: string;
  priceName: 'listPrice' | 'avgPrice' | 'minPrice';
  message: string;
}) => (
  <Form.Item shouldUpdate={(prevValues, currentValues) => prevValues !== currentValues}>
    {({ getFieldValue }) => {
      const enabled = getFieldValue(['pricing', checkboxName]);
      return (
        <Form.Item
          label={
            <Form.Item
              name={['pricing', checkboxName]}
              valuePropName="checked"
              noStyle
            >
              <Checkbox>{label}</Checkbox>
            </Form.Item>
          }
          tooltip={tooltip}
          name={['pricing', priceName]}
          rules={[
            {
              required: enabled,
              message,
            },
          ]}
        >
          <InputNumber
            min={0}
            step={0.01}
            style={{ width: '100%' }}
            disabled={!enabled}
          />
        </Form.Item>
      );
    }}
  </Form.Item>
);

export const SaleUnitPricingFields = () => (
  <FormContainer>
    <Form.Item
      name="unitName"
      tooltip="Nombre de la unidad de venta"
      label="Nombre de la Unidad"
      rules={[
        {
          required: true,
          message: 'Por favor ingresa el nombre de la unidad',
        },
      ]}
    >
      <Input placeholder="Ejemplo: Caja" />
    </Form.Item>
    <Grid>
      <Form.Item
        name="packSize"
        tooltip="Cantidad de productos en un paquete"
        label="Cantidad de Productos por Paquete"
        rules={[{ required: true, message: 'Por favor ingresa la cantidad' }]}
      >
        <InputNumber min={1} style={{ width: '100%' }} />
      </Form.Item>
    </Grid>
    <Grid>
      <Form.Item
        name={['pricing', 'currency']}
        tooltip="Moneda operativa de la unidad de venta"
        label="Moneda"
        rules={[{ required: true, message: 'Por favor selecciona la moneda' }]}
      >
        <Select
          options={[
            { value: 'DOP', label: 'DOP - Peso dominicano' },
            { value: 'USD', label: 'USD - Dólar estadounidense' },
          ]}
        />
      </Form.Item>
      <Form.Item
        name={['pricing', 'tax']}
        tooltip="Impuesto aplicado a la unidad de venta"
        label="Impuesto"
        rules={[{ required: true, message: 'Por favor ingresa el impuesto' }]}
      >
        <InputNumber style={{ width: '100%' }} placeholder="Ejemplo: IVA" />
      </Form.Item>
    </Grid>

    <Grid>
      <Form.Item
        name={['pricing', 'cost']}
        label="Costo"
        rules={[{ required: true, message: 'Por favor ingresa el costo' }]}
      >
        <InputNumber min={0} step={0.01} style={{ width: '100%' }} />
      </Form.Item>
    </Grid>

    <ConditionalPriceField
      checkboxName="listPriceEnabled"
      label="Precio de Lista"
      tooltip="El precio de lista es el precio sugerido para la venta al  publico."
      priceName="listPrice"
      message="Por favor ingresa el precio de lista"
    />

    <ConditionalPriceField
      checkboxName="avgPriceEnabled"
      label="Precio Promedio"
      tooltip="El precio promedio es el precio que se espera que el producto se venda en el mercado."
      priceName="avgPrice"
      message="Por favor ingresa el precio promedio"
    />

    <ConditionalPriceField
      checkboxName="minPriceEnabled"
      label="Precio Minimo"
      tooltip="El precio minimo es el precio mas bajo al que se puede vender el producto."
      priceName="minPrice"
      message="Por favor ingresa el precio minimo"
    />
  </FormContainer>
);
