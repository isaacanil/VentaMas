import { ShopOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { Form, Input, Button, Select, message, Card, Typography } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { createBusiness } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import ROUTES_PATH from '../../../../../routes/routesName';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import { countries } from './countries.json';

const { Option } = Select;
const { Title } = Typography;

const BusinessCreator = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [imageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const { BUSINESSES } = ROUTES_PATH.DEV_VIEW_TERM;

  const handleSubmit = async (values) => {
    try {
      setLoading(true);

      // Create business data
      const businessData = {
        name: values.name,
        logoUrl: imageUrl || '',
        country: values.country || '',
        province: values.province || '',
        tel: values.tel || '',
        email: values.email || '',
        rnc: values.rnc || '',
        address: values.address || '',
        businessType: values.businessType || 'general',
        invoice: {
          invoiceMessage: values.invoice?.invoiceMessage || '',
          invoiceType: 'invoiceTemplate1',
        },
      };

      await createBusiness(businessData);
      message.success('Negocio creado exitosamente');
      navigate(BUSINESSES);
    } catch (error) {
      message.error(error.message || 'Error al crear el negocio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <MenuApp sectionName={'Crear Nuevo Negocio'} />
      <PageContainer>
        <StyledForm form={form} layout="vertical" onFinish={handleSubmit}>
          <FormSection>
            <Title level={4}>
              <ShopOutlined /> Información del Negocio
            </Title>
            <Card>
              <Form.Item
                name="businessType"
                label="Tipo de Negocio"
                rules={[
                  {
                    required: true,
                    message: 'Por favor, selecciona el tipo de negocio',
                  },
                ]}
              >
                <Select placeholder="Selecciona el tipo de negocio">
                  <Option value="general">General</Option>
                  <Option value="pharmacy">Farmacia</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="name"
                label="Nombre del Negocio"
                rules={[
                  {
                    required: true,
                    message: 'Por favor, ingresa el nombre del negocio',
                  },
                ]}
              >
                <Input placeholder="Nombre del negocio" />
              </Form.Item>

              <Form.Item name="rnc" label="RNC">
                <Input placeholder="Ingresa el RNC" />
              </Form.Item>
            </Card>
          </FormSection>

          <FormSection>
            <Title level={4}>
              <MailOutlined /> Contacto
            </Title>
            <Card>
              <TwoColumns>
                <Form.Item name="email" label="Correo electrónico">
                  <Input placeholder="ejemplo@dominio.com" />
                </Form.Item>

                <Form.Item
                  name="tel"
                  label="Teléfono"
                  rules={[
                    {
                      required: true,
                      message: 'Por favor, ingresa el teléfono',
                    },
                  ]}
                >
                  <Input placeholder="55 1234 5678" />
                </Form.Item>
              </TwoColumns>
            </Card>
          </FormSection>

          <FormSection>
            <Title level={4}>
              <HomeOutlined /> Ubicación
            </Title>
            <Card>
              <TwoColumns>
                <Form.Item name="country" label="País">
                  <Select placeholder="Selecciona un país">
                    {countries.map((country) => (
                      <Option key={country.id} value={country.id}>
                        {country.name}
                      </Option>
                    ))}
                  </Select>
                </Form.Item>

                <Form.Item name="province" label="Provincia/Estado">
                  <Input placeholder="Provincia o Estado" />
                </Form.Item>
              </TwoColumns>

              <Form.Item
                name="address"
                label="Dirección"
                rules={[
                  {
                    required: true,
                    message: 'Por favor, ingresa la dirección',
                  },
                ]}
              >
                <Input placeholder="Calle 123, Colonia, Ciudad, Estado" />
              </Form.Item>
            </Card>
          </FormSection>

          <FormActions>
            <Button
              onClick={() => navigate('/settings')}
              style={{ marginRight: 8 }}
            >
              Cancelar
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Crear Negocio
            </Button>
          </FormActions>
        </StyledForm>
      </PageContainer>
    </Wrapper>
  );
};

export default BusinessCreator;

const Wrapper = styled.div`
  display: grid;
  max-height: 100vh;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
  background: #f5f5f5;
`;

const PageContainer = styled.div`
  padding: 24px;
  width: 100%;
  overflow-y: auto;
`;

const StyledForm = styled(Form)`
  max-width: 900px;
  margin: 0 auto;
  background: transparent;
`;

const FormSection = styled.div`
  margin-bottom: 32px;

  .ant-card {
    border-radius: 8px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  }

  .ant-typography {
    margin-bottom: 16px;
  }
`;

const TwoColumns = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;

  button {
    min-width: 100px;
  }
`;
