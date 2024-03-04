import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as antd from 'antd';
const { Form, Input, Button, Typography, Select, message } = antd;
import { fbUpdateBusinessInfo } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import { selectUser } from '../../../../../features/auth/userSlice';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';
import styled from 'styled-components';
import { countries } from './countries.json';
const { Title, Paragraph } = Typography;
const { Option } = Select;


const BusinessInfo = () => {
  const business = useSelector(selectBusinessData);
  const [form] = Form.useForm();
  const user = useSelector(selectUser);

  useEffect(() => {
    if (business) {
      form.setFieldsValue(business);
    }
  }, [business, form]);

  const handleSubmit = async (values) => {
    try {
      const businessData = {...business,  ...values };
      await fbUpdateBusinessInfo(user, businessData);
      message.success('Información actualizada');
    } catch (error) {
      message.error('Error al actualizar la información');
    }
  };
  const metadata = {
    title: 'Información del negocio',
    description:
      'Agrega la información de tu negocio, como nombre, dirección, teléfono, país y provincia. Esta información se utilizará en tus facturas.',
  };

  return (
    <div>
      <MenuApp sectionName={"Formulario de Negocio"} />
      <Container>
        <Typography>
          <Title level={4}>{metadata.title}</Title>
          <Paragraph>{metadata.description}</Paragraph>
        </Typography>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: 'Por favor, ingresa el nombre del negocio' }]}>
            <Input placeholder="Nombre del negocio" />
          </Form.Item>
          <Form.Item
            name="tel"
            label="Teléfono"
            rules={[{ required: true, message: 'Por favor, ingresa el teléfono' }]}>
            <Input placeholder="55 1234 5678" />
          </Form.Item>
          <Form.Item
            name="country"
            label="País"
            rules={[{ required: true, message: 'Por favor, selecciona un país' }]}>
            <Select placeholder="Selecciona un país">
              {countries.map(country => (
                <Option key={country.id} value={country.id}>{country.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="province"
            label="Provincia/Estado"
            rules={[{ required: true, message: 'Por favor, ingresa la provincia o estado' }]}>
            <Input placeholder="Provincia o Estado" />
          </Form.Item>
          <Form.Item
            name="address"
            label="Dirección"
            rules={[{ required: true, message: 'Por favor, ingresa la dirección' }]}>
            <Input placeholder="Calle 123, Colonia, Ciudad, Estado" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Guardar
            </Button>
          </Form.Item>
        </Form>
      </Container>

    </div>
  );
};

export default BusinessInfo;

const Container = styled.div`
  padding: 20px;
  max-width: 600px;
  margin: 0 auto;
`;
