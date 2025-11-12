import {
  PlusOutlined,
  LoadingOutlined,
  ShopOutlined,
  MailOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import {
  Form,
  Input,
  Button,
  Select,
  message,
  Upload,
  Card,
  Typography,
} from 'antd';
import imageCompression from 'browser-image-compression';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { selectUser } from '../../../../../features/auth/userSlice';
import {
  fbUpdateBusinessInfo,
  fbUpdateBusinessLogo,
} from '../../../../../firebase/businessInfo/fbAddBusinessInfo';

import { countries } from './countries.json';

const { Option } = Select;
const { Title } = Typography;

const BusinessProfileEditor = () => {
  const business = useSelector(selectBusinessData);
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const [imageUrl, setImageUrl] = useState(business?.logoUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (business) {
      setImageUrl(business.logoUrl);
      form.setFieldsValue({
        ...business,
        logo: business.logoUrl,
      });
    }
  }, [business, form]);

  const compressImage = async (file) => {
    // Calcular el factor de compresión basado en el tamaño del archivo
    const fileSize = file.size / (1024 * 1024); // convertir a MB
    const options = {
      maxSizeMB: fileSize > 2 ? 1 : fileSize * 0.8, // Si es mayor a 2MB, comprimir a 1MB, sino al 80% del tamaño actual
      maxWidthOrHeight: 1200, // máximo 1200px en cualquier dimensión
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: fileSize > 2 ? 0.6 : 0.8, // Menor calidad si el archivo es grande
    };

    try {
      const compressedFile = await imageCompression(file, options);
      if (compressedFile.size > 2 * 1024 * 1024) {
        // Si aún es mayor a 2MB, comprimir más
        return await imageCompression(compressedFile, {
          ...options,
          maxSizeMB: 1,
          initialQuality: 0.5,
        });
      }
      return compressedFile;
    } catch (error) {
      console.error('Error al comprimir la imagen', error);
      message.error('Error al comprimir la imagen');
      return null;
    }
  };

  const beforeUpload = async (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Solo puedes subir archivos JPG/PNG!');
      return false;
    }

    try {
      // Comprimir imagen automáticamente
      const compressedFile = await compressImage(file);
      if (compressedFile) {
        const finalSize = (compressedFile.size / (1024 * 1024)).toFixed(2);
        message.success(`Imagen optimizada a ${finalSize}MB`);
        return compressedFile;
      }
      return false;
    } catch (error) {
      console.error('Error al procesar la imagen', error);
      message.error('Error al procesar la imagen');
      return false;
    }
  };

  const handleChange = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      try {
        const downloadURL = await fbUpdateBusinessLogo(
          user,
          info.file.originFileObj,
        );
        setLoading(false);
        setImageUrl(downloadURL);
        form.setFieldsValue({ logo: downloadURL });
        message.success('Logo actualizado correctamente');
      } catch (error) {
        setLoading(false);
        console.error('Error al actualizar el logo', error);
        message.error('Error al actualizar el logo');
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      const invoiceData = {
        invoiceMessage: business?.invoice?.invoiceMessage || '',
        invoiceType: business?.invoice?.invoiceType || 'invoiceTemplate1',
        ...(values?.invoice || {}),
      };
      const businessData = {
        ...business,
        ...values,
        logoUrl: imageUrl || '',
        logo: values.logo || '',
        country: values.country || '',
        province: values.province || '',
        tel: values.tel || '',
        email: values.email || '',
        rnc: values.rnc || '',
        address: values.address || '',
        name: values.name || '',
        businessType: values.businessType || 'general',
        invoice: invoiceData,
      };

      await fbUpdateBusinessInfo(user, businessData);
      message.success('Información actualizada');
    } catch (error) {
      console.error('Error al actualizar la información del negocio', error);
      message.error(error?.message || 'Error al actualizar la información');
    }
  };

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Subir Logo</div>
    </div>
  );

  const formContent = (
    <StyledForm form={form} layout="vertical" onFinish={handleSubmit}>
      <FormSection>
        <Title level={4}>
          <ShopOutlined /> Información General
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

          <LogoSection>
            <Form.Item
              name="logo"
              label="Logo del negocio"
              extra="Formato: JPG/PNG. Tamaño máximo: 2MB. Dimensiones recomendadas: 400x200px"
            >
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={({ onSuccess }) =>
                  setTimeout(() => onSuccess('ok'), 0)
                }
              >
                {imageUrl ? (
                  <PreviewContainer>
                    <img src={imageUrl} alt="logo" />
                  </PreviewContainer>
                ) : (
                  uploadButton
                )}
              </Upload>
            </Form.Item>
          </LogoSection>

          <Form.Item
            name="name"
            label="Nombre"
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
            <Form.Item
              name="email"
              label="Correo electrónico"
              rules={[
                {
                  type: 'email',
                  message: 'Ingresa un correo electrónico válido',
                },
              ]}
            >
              <Input placeholder="ejemplo@dominio.com" />
            </Form.Item>

            <Form.Item
              name="tel"
              label="Teléfono"
              rules={[
                { required: true, message: 'Por favor, ingresa el teléfono' },
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
              { required: true, message: 'Por favor, ingresa la dirección' },
            ]}
          >
            <Input placeholder="Calle 123, Colonia, Ciudad, Estado" />
          </Form.Item>
        </Card>
      </FormSection>

      <FormActions>
        <Button type="primary" htmlType="submit" size="large">
          Guardar Cambios
        </Button>
      </FormActions>
    </StyledForm>
  );

  return (
    <Wrapper>
      <PageContainer>{formContent}</PageContainer>
    </Wrapper>
  );
};

export default BusinessProfileEditor;

const Wrapper = styled.div`
  display: grid;
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
    min-width: 150px;
  }
`;
