import React, { useState } from 'react';
import * as antd from 'antd';
const { Modal, Menu, Form, Input, Button } = antd;
import { MailOutlined, AppstoreOutlined } from '@ant-design/icons';

export const BusinessEditModal = ({ isOpen }) => {
  const [currentSection, setCurrentSection] = useState('products');

  const renderContent = () => {
    switch (currentSection) {
      case 'products':
        return <ProductsForm />;
      case 'categories':
        return <CategoriesForm />;
      default:
        return null;
    }
  };

  return (
    <Modal
      title="Editar Negocio"
      open={isOpen}
      // onCancel={onClose}
      width={800}
      footer={null}
    >
      <div style={{ display: 'flex', height: '100%' }}>
        <Menu
          style={{ width: 256 }}
          selectedKeys={[currentSection]}
          mode="inline"
          onClick={({ key }) => setCurrentSection(key)}
        >
          <Menu.Item key="products" icon={<AppstoreOutlined />}>
            Productos
          </Menu.Item>
          <Menu.Item key="categories" icon={<MailOutlined />}>
            Categorías
          </Menu.Item>
          {/* Puedes agregar más secciones aquí */}
        </Menu>
        <div style={{ flex: 1, padding: '0 24px' }}>
          {renderContent()}
        </div>
      </div>
    </Modal>
  );
};

const ProductsForm = () => (
  <Form layout="vertical">
    <Form.Item label="Nombre del Producto">
      <Input placeholder="Introduce el nombre del producto" />
    </Form.Item>
    {/* Más campos según sea necesario */}
    <Button type="primary">Guardar Cambios</Button>
  </Form>
);

const CategoriesForm = () => (
  <Form layout="vertical">
    <Form.Item label="Nombre de la Categoría">
      <Input placeholder="Introduce el nombre de la categoría" />
    </Form.Item>
    {/* Más campos según sea necesario */}
    <Button type="primary">Guardar Cambios</Button>
  </Form>
);


