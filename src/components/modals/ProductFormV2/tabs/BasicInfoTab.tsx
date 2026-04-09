import React from 'react';
import { Form, Input, Select, Row, Col, Card, Upload, Space, Typography, Button } from 'antd';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

export const BasicInfoTab = () => {
  return (
    <Card 
      title="Información Básica" 
      bordered={false} 
      style={{ boxShadow: 'none' }}
    >
      <Row gutter={24}>
        <Col span={16}>
          <Form.Item
            name="name"
            label="Nombre del producto"
            rules={[{ required: true, message: 'El nombre es obligatorio' }]}
          >
            <Input size="large" placeholder="Ej. Refrigerador Samsung 15 pies" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="itemType" label="Tipo de ítem" rules={[{ required: true }]}>
                <Select size="large" placeholder="Seleccione">
                  <Option value="product">Producto (Inventariable)</Option>
                  <Option value="service">Servicio</Option>
                  <Option value="combo">Combo / Kit</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="type" label="Clasificación / Etiqueta" rules={[{ required: true }]}>
                <Input size="large" placeholder="Ej. Electrodoméstico" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="category" label="Categoría">
                <Select showSearch size="large" placeholder="Seleccione o cree una categoría">
                  <Option value="cat1">Línea Blanca</Option>
                  <Option value="cat2">Audio y Video</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="brand" label="Marca / Laboratorio">
                <Select showSearch size="large" placeholder="Seleccione la marca">
                  <Option value="brand1">Samsung</Option>
                  <Option value="brand2">LG</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Descripción (Opcional)">
            <TextArea rows={3} placeholder="Añada detalles adicionales sobre el producto..." />
          </Form.Item>
        </Col>

        <Col span={8}>
          <Form.Item label="Imagen del Producto">
            <Upload.Dragger 
              name="files" 
              action="/upload.do" 
              style={{ padding: '20px', background: '#fafafa', borderRadius: '8px' }}
              showUploadList={false}
            >
              <p className="ant-upload-drag-icon" style={{ fontSize: '32px', color: '#1890ff', margin: 0 }}>
                 +
              </p>
              <Text strong style={{ display: 'block', marginTop: '10px' }}>Haga clic o arrastre aquí</Text>
              <Text type="secondary" style={{ fontSize: '12px' }}>Soporta JPG, PNG (Max 5MB)</Text>
            </Upload.Dragger>
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
};
