import { Card, InputNumber, Row, Col, Select, Checkbox, Form } from 'antd';
import { useSelector } from 'react-redux';

import { selectTaxReceiptEnabled } from '@/features/taxReceipt/taxReceiptSlice';
import {
  initTaxes,
  taxLabel,
} from '@/views/component/modals/UpdateProduct/InitializeData';


export const PriceInfo = () => {
  const taxReceiptEnabled = useSelector(selectTaxReceiptEnabled);
  const taxOptions = initTaxes.map((tax) => ({
    value: tax,
    label: taxLabel(tax),
  }));
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
            <Checkbox title="Inventariable" defaultChecked={true}>
              Facturable
            </Checkbox>
          </Form.Item>
        </Col>
      </Row>
      <Row gutter={16}>
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
              taxReceiptEnabled
                ? ''
                : 'El impuesto no se aplicará a la venta del producto. La facturación de impuestos está desactivada.'
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
