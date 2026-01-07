// @ts-nocheck
import {
  CloudUploadOutlined,
  HomeOutlined,
  InfoCircleOutlined,
  MailOutlined,
  PictureOutlined,
  ReloadOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Select,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import React from 'react';
import styled from 'styled-components';

const { Option } = Select;
const { Title, Paragraph, Text } = Typography;

export const Wrapper = styled.div`
  display: grid;
  gap: 20px;
  width: 100%;
  padding: 16px;
`;

export const PageContainer = styled.div`
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
`;

export const StyledForm = styled(Form)`
  width: 100%;
  margin: 0 auto 32px;
  display: grid;
  gap: 20px;
`;

const PageHeader = styled.header`
  display: grid;
  gap: 8px;
  background: #fdfdfd;
  border-radius: 12px;
  padding: 20px 24px 16px;
  border: 1px solid #e5e9f2;

  h3 {
    margin-bottom: 0;
  }

  p {
    margin: 0;
    color: #4b5563;
  }
`;

const FormSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`;

const SectionHeaderContent = styled.div`
  flex: 1;
`;

const SectionTitleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const IconBubble = styled.span`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #e6f4ff;
  color: #1677ff;
  font-size: 18px;
`;

const SectionTitle = styled.h4`
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f1f1f;
`;

const ConfigCard = styled(Card)`
  border-radius: 12px;
  border: 1px solid #e5e9f2;
  box-shadow: none;
  background: #fdfdfd;

  .ant-card-body {
    padding: 22px;
  }
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: ${({ $columns }) =>
    $columns || 'repeat(auto-fit, minmax(260px, 1fr))'};
  gap: 18px;
  width: 100%;

  @media (width <= 768px) {
    grid-template-columns: 1fr;
  }
`;

const LogoPanel = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: center;
`;

const LogoPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 180px;
  height: 180px;
  background: #f8fafc;
  border: 1px solid #e5e9f2;
  border-radius: 16px;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

const LogoActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
`;

const LogoActionButton = styled(Button)`
  justify-content: center;
  width: 200px;
`;

const LogoUpload = styled(Upload)`
  display: inline-flex;

  .ant-upload {
    width: 100%;
  }
`;

const LogoHint = styled(Text)`
  color: #6b7280;
  max-width: 360px;
  line-height: 1.4;
`;

const InfoIcon = styled(InfoCircleOutlined)`
  color: #98a2b3;
  font-size: 16px;
  cursor: pointer;
`;

const LabelWithInfo = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

const FormActions = styled.div`
  position: sticky;
  bottom: 0;
  width: 100%;
  padding: 12px 24px;
  background: rgba(253, 253, 253, 0.92);
  backdrop-filter: blur(8px);
  border: 1px solid #e5e9f2;
  box-shadow: none;
  z-index: 5;
  display: flex;
  justify-content: center;
  max-width: 960px;
  border-radius: 12px;
  margin: 0 auto;
`;

const FormActionsInner = styled.div`
  width: 100%;
  display: flex;
  justify-content: flex-end;
  gap: 12px;

  button {
    min-width: 150px;
  }
`;

export const BusinessProfileHeader = () => (
  <PageHeader>
    <div>
      <Title level={3}>Perfil de la empresa</Title>
      <Paragraph type="secondary">
        Actualiza los datos que Ventas y Facturación muestran al cliente.
      </Paragraph>
    </div>
  </PageHeader>
);

export const GeneralInformationSection = ({
  beforeUpload,
  handleChange,
  imageUrl,
  onResetLogo,
  uploading,
}) => (
  <FormSection>
    <SectionHeader>
      <IconBubble>
        <ShopOutlined />
      </IconBubble>
      <SectionHeaderContent>
        <SectionTitleRow>
          <SectionTitle>Información general</SectionTitle>
          <Tooltip title="Define tipo de negocio y datos legales que verán tus comprobantes.">
            <InfoIcon />
          </Tooltip>
        </SectionTitleRow>
      </SectionHeaderContent>
    </SectionHeader>
    <ConfigCard>
      <CardBody>
        <FormGrid>
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
            label="Nombre comercial"
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
        </FormGrid>

        <Divider />

        <Form.Item
          name="logo"
          label={
            <LabelWithInfo>
              Logo del negocio
              <Tooltip title="Se usa en cotizaciones, facturas y la app. Prefiere una versión horizontal y ligera.">
                <InfoIcon />
              </Tooltip>
            </LabelWithInfo>
          }
          extra="Formatos aceptados: JPG/PNG. Tamaño máximo: 2MB."
        >
          <LogoPanel>
            <LogoPreview>
              {imageUrl ? (
                <img src={imageUrl} alt="Logo del negocio" />
              ) : (
                <PictureOutlined style={{ fontSize: 42, color: '#94a3b8' }} />
              )}
            </LogoPreview>
            <LogoActions>
              <LogoUpload
                name="avatar"
                showUploadList={false}
                beforeUpload={beforeUpload}
                onChange={handleChange}
                customRequest={({ onSuccess }) => setTimeout(() => onSuccess('ok'), 0)}
                accept="image/png,image/jpeg"
              >
                <LogoActionButton
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  loading={uploading}
                >
                  {imageUrl ? 'Cambiar logo' : 'Agregar logo'}
                </LogoActionButton>
              </LogoUpload>
              <LogoActionButton
                icon={<ReloadOutlined />}
                onClick={onResetLogo}
                disabled={!imageUrl}
              >
                Quitar logo
              </LogoActionButton>
              <LogoHint>
                Recomendación: versión horizontal y ligera para correos y
                comprobantes.
              </LogoHint>
            </LogoActions>
          </LogoPanel>
        </Form.Item>
      </CardBody>
    </ConfigCard>
  </FormSection>
);

export const ContactChannelsSection = () => (
  <FormSection>
    <SectionHeader>
      <IconBubble>
        <MailOutlined />
      </IconBubble>
      <SectionHeaderContent>
        <SectionTitleRow>
          <SectionTitle>Contacto y canales</SectionTitle>
          <Tooltip title="Se muestran en tus correos y comprobantes para que clientes te ubiquen.">
            <InfoIcon />
          </Tooltip>
        </SectionTitleRow>
      </SectionHeaderContent>
    </SectionHeader>
    <ConfigCard>
      <CardBody>
        <FormGrid $columns="repeat(auto-fit, minmax(240px, 1fr))">
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
            <Input placeholder="contacto@ventamas.com" />
          </Form.Item>

          <Form.Item
            name="tel"
            label="Teléfono"
            rules={[
              { required: true, message: 'Por favor, ingresa el teléfono' },
            ]}
          >
            <Input placeholder="+52 55 1234 5678" />
          </Form.Item>
        </FormGrid>
      </CardBody>
    </ConfigCard>
  </FormSection>
);

export const LocationSection = ({ countries = [] }) => (
  <FormSection>
    <SectionHeader>
      <IconBubble>
        <HomeOutlined />
      </IconBubble>
      <SectionHeaderContent>
        <SectionTitleRow>
          <SectionTitle>Ubicación</SectionTitle>
          <Tooltip title="Dirección fiscal y de correspondencia para reportes y documentos.">
            <InfoIcon />
          </Tooltip>
        </SectionTitleRow>
      </SectionHeaderContent>
    </SectionHeader>
    <ConfigCard>
      <CardBody>
        <FormGrid $columns="repeat(auto-fit, minmax(240px, 1fr))">
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
        </FormGrid>

        <Form.Item
          name="address"
          label="Dirección"
          rules={[
            { required: true, message: 'Por favor, ingresa la dirección' },
          ]}
        >
          <Input.TextArea
            placeholder="Calle 123, Colonia, Ciudad, Estado"
            autoSize={{ minRows: 3, maxRows: 6 }}
          />
        </Form.Item>
      </CardBody>
    </ConfigCard>
  </FormSection>
);

export const FormActionsBar = ({ children }) => (
  <FormActions>
    <FormActionsInner>{children}</FormActionsInner>
  </FormActions>
);

export const SubmitButton = (props) => (
  <Button type="primary" htmlType="submit" size="large" {...props}>
    Guardar Cambios
  </Button>
);
