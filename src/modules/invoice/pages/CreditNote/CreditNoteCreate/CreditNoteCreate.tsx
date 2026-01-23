import { SaveOutlined, ArrowLeftOutlined } from '@/constants/icons/antd';
import {
  Card,
  Form,
  Input,
  Select,
  InputNumber,
  Button,
  Row,
  Col,
  DatePicker,
  message,
} from 'antd';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import ROUTES_NAME from '@/router/routes/routesName';

const { Option } = Select;
const { CREDIT_NOTE_LIST } = ROUTES_NAME.CREDIT_NOTE_TERM;

type CreditNoteFormValues = {
  clientId?: string | number;
  date?: unknown;
  type?: string;
  referenceInvoice?: string;
  amount?: number;
  description?: string;
};

type MockClient = {
  id: number;
  name: string;
  rncCedula: string;
};

export const CreditNoteCreate = () => {
  const [form] = Form.useForm<CreditNoteFormValues>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Datos de ejemplo para clientes - esto se reemplazará con datos reales más tarde
  const mockClients: MockClient[] = [
    { id: 1, name: 'Cliente Ejemplo', rncCedula: '123456789' },
    { id: 2, name: 'Otro Cliente', rncCedula: '987654321' },
    { id: 3, name: 'Empresa ABC', rncCedula: '111222333' },
  ];

  const handleSubmit = async (_values: CreditNoteFormValues) => {
    setLoading(true);
    try {
      // Aquí iría la lógica para guardar la nota de crédito

      // Simular guardado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      message.success('Nota de crédito creada exitosamente');
      navigate(CREDIT_NOTE_LIST);
    } catch (error) {
      console.error(error);
      message.error('Error al crear la nota de crédito');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(CREDIT_NOTE_LIST);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card
        title="Crear Nota de Crédito"
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
            Volver al Listado
          </Button>
        }
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            date: new Date(),
            type: 'devolucion',
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Cliente"
                name="clientId"
                rules={[{ required: true, message: 'Seleccione un cliente' }]}
              >
                <Select
                  placeholder="Seleccionar cliente"
                  showSearch
                  optionFilterProp="children"
                >
                  {mockClients.map((client) => (
                    <Option key={client.id} value={client.id}>
                      {client.name} ({client.rncCedula})
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Fecha"
                name="date"
                rules={[{ required: true, message: 'Seleccione la fecha' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={8}>
              <Form.Item
                label="Tipo de Nota"
                name="type"
                rules={[{ required: true, message: 'Seleccione el tipo' }]}
              >
                <Select placeholder="Seleccionar tipo">
                  <Option value="devolucion">Devolución</Option>
                  <Option value="descuento">Descuento</Option>
                  <Option value="anulacion">Anulación</Option>
                  <Option value="correccion">Corrección</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col xs={24} sm={12}>
              <Form.Item
                label="Factura de Referencia"
                name="referenceInvoice"
                rules={[
                  {
                    required: true,
                    message: 'Ingrese la factura de referencia',
                  },
                ]}
              >
                <Input placeholder="Número de factura" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12}>
              <Form.Item
                label="Monto"
                name="amount"
                rules={[
                  { required: true, message: 'Ingrese el monto' },
                  {
                    type: 'number',
                    min: 0.01,
                    message: 'El monto debe ser mayor a 0',
                  },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="0.00"
                  step={0.01}
                  precision={2}
                  formatter={(value) =>
                    `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                  }
                  parser={(value) =>
                    value ? value.replace(/\$\s?|(,*)/g, '') : ''
                  }
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label="Motivo/Descripción"
            name="description"
            rules={[
              { required: true, message: 'Ingrese el motivo o descripción' },
            ]}
          >
            <Input.TextArea
              rows={4}
              placeholder="Describe el motivo de la nota de crédito..."
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
              size="large"
            >
              Crear Nota de Crédito
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
