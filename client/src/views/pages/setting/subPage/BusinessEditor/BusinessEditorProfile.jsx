import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import * as antd from 'antd';
const { Form, Input, Button, Select, message,  Upload } = antd;
import { PlusOutlined, LoadingOutlined } from '@ant-design/icons';
import { fbUpdateBusinessInfo, fbUpdateBusinessLogo } from '../../../../../firebase/businessInfo/fbAddBusinessInfo';
import { selectUser } from '../../../../../features/auth/userSlice';
import { selectBusinessData } from '../../../../../features/auth/businessSlice';
import { MenuApp } from '../../../../templates/MenuApp/MenuApp';
import styled from 'styled-components';
import { countries } from './countries.json';
import { useWindowWidth } from '../../../../../hooks/useWindowWidth';
import imageCompression from 'browser-image-compression';

const { Option } = Select;


const BusinessProfileEditor = () => {
  const business = useSelector(selectBusinessData);
  const [form] = Form.useForm();
  const user = useSelector(selectUser);
  const isMobile = useWindowWidth(768);
  const [imageUrl, setImageUrl] = useState(business?.logoUrl || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (business) {
      setImageUrl(business.logoUrl);
      form.setFieldsValue({
        ...business,
        logo: business.logoUrl
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
      message.error('Error al procesar la imagen');
      return false;
    }
  };

  const getImageDimensions = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        resolve(Math.max(img.width, img.height));
      };
    });
  };

  const handleChange = async (info) => {
    if (info.file.status === 'uploading') {
      setLoading(true);
      return;
    }

    if (info.file.status === 'done') {
      try {
        const downloadURL = await fbUpdateBusinessLogo(user, info.file.originFileObj);
        setLoading(false);
        setImageUrl(downloadURL);
        form.setFieldsValue({ logo: downloadURL });
        message.success('Logo actualizado correctamente');
      } catch (error) {
        setLoading(false);
        message.error('Error al actualizar el logo');
      }
    }
  };

  const getBase64 = (img, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(img);
  };

  const handleSubmit = async (values) => {
    try {
      const invoiceData = {
        invoiceMessage: values.invoice?.invoiceMessage || '',
        invoiceType: values.invoice?.invoiceType || 'invoiceTemplate1',
      };
      const businessData = {
        ...business,
        ...values,
        logoUrl: imageUrl,
        country: values.country || '',
        province: values.province || '',
        tel: values.tel || '',
        email: values.email || '',
        rnc: values.rnc || '',
        address: values.address || '',
        name: values.name || '',
        invoice: invoiceData
      };

      console.log(businessData)
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

  const uploadButton = (
    <div>
      {loading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Subir Logo</div>
    </div>
  );

  const formContent = (
    <Form form={form} layout="vertical" onFinish={handleSubmit}>
      <Form.Item
        name="logo"
        label="Logo del negocio"
        extra="Formato: JPG/PNG. Tamaño máximo: 2MB. Dimensiones recomendadas: 400x200px">
        <Upload
          name="avatar"
          listType="picture-card"
          className="avatar-uploader"
          showUploadList={false}
          beforeUpload={beforeUpload}
          onChange={handleChange}
          customRequest={({ onSuccess }) => setTimeout(() => onSuccess("ok"), 0)}
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
      <Form.Item
        name="name"
        label="Nombre"
        rules={[{ required: true, message: 'Por favor, ingresa el nombre del negocio' }]}>
        <Input placeholder="Nombre del negocio" />
      </Form.Item>
      
      <Form.Item
        name="rnc"
        label="RNC"
      >
        <Input placeholder="Ingresa el RNC" />
      </Form.Item>

      <Form.Item
        name="email"
        label="Correo electrónico"
        rules={[
          { type: 'email', message: 'Ingresa un correo electrónico válido' }
        ]}
      >
        <Input placeholder="ejemplo@dominio.com" />
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
      >
        <Select placeholder="Selecciona un país">
          {countries.map(country => (
            <Option key={country.id} value={country.id}>{country.name}</Option>
          ))}
        </Select>
      </Form.Item>
      <Form.Item
        name="province"
        label="Provincia/Estado"
      >
        <Input placeholder="Provincia o Estado" />
      </Form.Item>
      <Form.Item
        name="address"
        label="Dirección"
        rules={[{ required: true, message: 'Por favor, ingresa la dirección' }]}>
        <Input placeholder="Calle 123, Colonia, Ciudad, Estado" />
      </Form.Item>
      <Form.Item
        name={['invoice', 'invoiceMessage']}
        label="Mensaje en la factura"
      >
        <Input.TextArea rows={4} placeholder="Escribe un mensaje personalizado para la factura, como 'Gracias por su compra'" />
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Guardar
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Wrapper>
      <MenuApp sectionName={"Formulario de Negocio"} />
      <Container>
      {formContent}
      </Container>
    </Wrapper>
  );
};

export default BusinessProfileEditor;

const Container = styled.div`
  padding: 20px;
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
  overflow-y: auto;
`;

const Wrapper = styled.div`
  display: grid;
  max-height: 100vh;
  grid-template-rows: min-content 1fr;
  overflow: hidden;
`
const ContainerForm = styled.div`
max-width: 600px;
margin: 0 auto;
`

const TwoColumnLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const LeftColumn = styled.div`
  width: 100%;
`;

const RightColumn = styled.div`
  width: 100%;
  position: sticky;
  top: 1rem;
`;

const AvatarUploader = styled(Upload)`
  .ant-upload {
    width: 400px !important;
    height: 200px !important;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fafafa;
    border: 1px dashed #d9d9d9;
  }
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
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
    object-position: center;
  }
`;