import React, { useState } from 'react';
import * as antd from 'antd';
import ProductCard from './components/ProductCard';
const { Form, Input, InputNumber, Button, Modal, DatePicker, Select, Row, Col } = antd;
const { Option } = Select;
export const InvoiceForm = ({ }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});

  const onFinish = (values) => {
    // TODO: Implementar lógica para finalizar el formulario
  };

  const handleCancel = () => {
    // TODO: Implementar lógica para cancelar el formulario
  };

  return (
    <Modal
      title="Editar factura"
      open={false}
      onCancel={handleCancel}
      footer={null}
    >
      <Form form={form} initialValues={data} onFinish={onFinish} layout="vertical">
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="ncf" label="NCF">
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="client" label="Cliente">
              <Input />
            </Form.Item>
          </Col>
        </Row>
        <ProductCard />
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="date" label="Fecha">
              <DatePicker style={{ width: '100%' }} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="itbis" label="ITBIS">
              <InputNumber style={{ width: '100%' }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="payment" label="Pago">
          <InputNumber />
        </Form.Item>
        <Form.Item name="products" label="Productos">
          <InputNumber />
        </Form.Item>
        <Form.Item name="change" label="Cambio">
          <InputNumber />
        </Form.Item>
        <Form.Item name="total" label="Total">
          <InputNumber />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Guardar cambios
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};



