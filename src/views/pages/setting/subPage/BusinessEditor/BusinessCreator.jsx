import { ShopOutlined, MailOutlined, HomeOutlined } from '@ant-design/icons';
import { Form, Input, Button, Select, message, Card, Typography } from 'antd';
import imageCompression from 'browser-image-compression';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { createBusiness } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import ROUTES_PATH from '../../../../../routes/routesName';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';

import { countries } from './countries.json';

const { Option } = Select;
const { Title, Text } = Typography;

const BusinessCreator = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [imageUrl, setImageUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const {BUSINESSES} = ROUTES_PATH.DEV_VIEW_TERM

  const compressImage = async (file) => {
    const fileSize = file.size / (1024 * 1024);
    const options = {
      maxSizeMB: fileSize > 2 ? 1 : fileSize * 0.8,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: fileSize > 2 ? 0.6 : 0.8,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      if (compressedFile.size > 2 * 1024 * 1024) {
        return await imageCompression(compressedFile, {
          ...options,
          maxSizeMB: 1,
          initialQuality: 0.5,
        });
      }
      return compressedFile;
    } catch (error) {
      message.error('Error al comprimir la imagen');
      return null;
    }
  };

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
          invoiceType: 'invoiceTemplate1'
        }
      };


      await createBusiness(businessData);
      message.success('Negocio creado exitosamente');
      navigate(BUSINESSES)

    } catch (error) {
      message.error(error.message || 'Error al crear el negocio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <MenuApp sectionName={"Crear Nuevo Negocio"} />
      <PageContainer>
        <StyledForm form={form} layout="vertical" onFinish={handleSubmit}>
          <FormSection>
            <Title level={4}><ShopOutlined /> Información del Negocio</Title>
            <Card>
              <Form.Item
                name="businessType"
                label="Tipo de Negocio"
                rules={[{ required: true, message: 'Por favor, selecciona el tipo de negocio' }]}
              >
                <Select placeholder="Selecciona el tipo de negocio">
                  <Option value="general">General</Option>
                  <Option value="pharmacy">Farmacia</Option>
                </Select>
              </Form.Item>

              <Form.Item
                name="name"
                label="Nombre del Negocio"
                rules={[{ required: true, message: 'Por favor, ingresa el nombre del negocio' }]}>
                <Input placeholder="Nombre del negocio" />
              </Form.Item>

              <Form.Item
                name="rnc"
                label="RNC">
                <Input placeholder="Ingresa el RNC" />
              </Form.Item>
            </Card>
          </FormSection>

          <FormSection>
            <Title level={4}><MailOutlined /> Contacto</Title>
            <Card>
              <TwoColumns>
                <Form.Item
                  name="email"
                  label="Correo electrónico"
                >
                  <Input placeholder="ejemplo@dominio.com" />
                </Form.Item>

                <Form.Item
                  name="tel"
                  label="Teléfono"
                  rules={[{ required: true, message: 'Por favor, ingresa el teléfono' }]}>
                  <Input placeholder="55 1234 5678" />
                </Form.Item>
              </TwoColumns>
            </Card>
          </FormSection>

          <FormSection>
            <Title level={4}><HomeOutlined /> Ubicación</Title>
            <Card>
              <TwoColumns>
                <Form.Item name="country" label="País">
                  <Select placeholder="Selecciona un país">
                    {countries.map(country => (
                      <Option key={country.id} value={country.id}>{country.name}</Option>
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
                rules={[{ required: true, message: 'Por favor, ingresa la dirección' }]}>
                <Input placeholder="Calle 123, Colonia, Ciudad, Estado" />
              </Form.Item>
            </Card>
          </FormSection>

          <FormActions>
            <Button onClick={() => navigate('/settings')} style={{ marginRight: 8 }}>
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

const LogoSection = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 24px;

  .avatar-uploader {
    .ant-upload {
      width: 300px !important;
      height: 150px !important;
      border-radius: 8px;
      background: #fafafa;
      border: 2px dashed #d9d9d9;
      transition: all 0.3s ease;

      &:hover {
        border-color: #1890ff;
      }
    }
  }
`;

const PreviewContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    border-radius: 4px;
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