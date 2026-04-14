import { Card, InputNumber, Row, Col, Select, Checkbox, Form } from 'antd';
import { useSelector } from 'react-redux';

import { selectCartTaxationEnabled } from '@/features/cart/cartSlice';
import {
  initTaxes,
  taxLabel,
} from '@/components/modals/UpdateProduct/InitializeData';

export const PriceInfo = () => {
  const taxationEnabled = useSelector(selectCartTaxationEnabled);
  const taxOptions = initTaxes.map((tax) => ({
    value: tax,
    label: taxLabel(tax),
  }));
  const currencyOptions = [
    { value: 'DOP', label: 'DOP - Peso dominicano' },
    { value: 'USD', label: 'USD - Dólar estadounidense' },
  ];
  return (
    <Card title="Información de precio" id="part-3" size="small">
      <Row gutter={16}>
        <Col>
          <Form.Item
            name="isVisible"
            label=""
            valuePropName="checked"
            help="Determina si el producto aparecerá en la facturación."
          >
            <Checkbox title="Inventariable">
              Facturable
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}>
          <Form.Item
            name={['pricing', 'currency']}
            label="Moneda del precio"
            rules={[{ required: true }]}
            help="Define la moneda operativa del costo y los precios de este producto."
          >
            <Select options={currencyOptions} popupMatchSelectWidth={false} />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['pricing', 'cost']}
            label="Costo"
            rules={[{ required: true }]}
          >
            <InputNumber
              placeholder=""
              style={{
                width: '100%',
              }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item
            name={['pricing', 'tax']}
            label="Impuesto"
            help={
              taxationEnabled
                ? ''
                : 'El impuesto no se aplicará según la política fiscal activa del negocio.'
            }
            rules={[{ required: true }]}
          >
            <Select options={taxOptions} popupMatchSelectWidth={false} />
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}></Row>
    </Card>
  );
};
