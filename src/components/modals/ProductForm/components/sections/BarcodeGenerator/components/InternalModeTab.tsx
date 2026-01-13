// @ts-nocheck
import {
  InfoCircleOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ShopOutlined,
} from '@/constants/icons/antd';
import {
  Form,
  Input,
  Button,
  Space,
  Alert,
  Typography,
  Checkbox,
  Tooltip,
} from 'antd';
import React from 'react';
import styled from 'styled-components';

import { PreviewContainer, PreviewText } from './BarcodePreview';

const { Text } = Typography;

// Contenedores con layout responsive
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;

  @media (width >= 1024px) {
    flex-direction: row;
    gap: 24px;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 16px;
`;

// Vista previa lateral removida (se usará modal externo)

const FormSection = styled.div`
  padding: 16px;
  border: 1px solid #eaeaea;
  border-radius: 4px;
`;

const FormSectionHeader = styled.h3`
  margin: 0 0 12px;
  font-size: 1.1rem;
`;

export const InternalModeTab = ({
  form,
  autoMode,
  setAutoMode,
  manualValues,
  itemReferenceValid,
  handleManualItemReferenceChange,
  nextItemReference,
  livePreview,
  handleGenerateCode,
  loadingGenerate,
  currentBarcode,
}) => {
  return (
    <Container>
      <MainContent>
        {/* Alerta informativa simplificada */}
        <Alert
          message="Códigos internos con capacidad de 999M productos"
          type="info"
          icon={<ShopOutlined />}
          showIcon
          style={{ marginBottom: '16px' }}
        />

        {/* Formulario de generación simplificado */}
        <FormSection>
          <FormSectionHeader>
            {currentBarcode
              ? 'Generar Nuevo Código Interno'
              : 'Generar Código Interno'}
          </FormSectionHeader>
          <Form form={form} layout="vertical" style={{ width: '100%' }}>
            {/* Checkbox para modo automático */}
            <Form.Item style={{ marginBottom: '16px' }}>
              <Checkbox
                checked={autoMode}
                onChange={(e) => setAutoMode(e.target.checked)}
              >
                <Space>
                  <Text>Generar referencia automáticamente</Text>
                  <Tooltip title="El sistema asignará automáticamente el siguiente número secuencial disponible">
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                  </Tooltip>
                </Space>
              </Checkbox>
            </Form.Item>

            {/* Solo un campo para la referencia del producto */}
            <Form.Item
              label="Referencia Producto"
              validateStatus={
                !autoMode && itemReferenceValid === false
                  ? 'error'
                  : itemReferenceValid === true
                    ? 'success'
                    : ''
              }
              help={
                !autoMode && itemReferenceValid === false
                  ? 'Debe contener 9 dígitos'
                  : ''
              }
            >
              <Input
                value={
                  autoMode ? nextItemReference : manualValues.itemReference
                }
                readOnly={autoMode}
                onChange={
                  !autoMode
                    ? (e) => handleManualItemReferenceChange(e.target.value)
                    : undefined
                }
                placeholder={autoMode ? undefined : '9 dígitos (ej: 000000001)'}
                maxLength={9}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  backgroundColor: `${autoMode ? '#f6ffed' : 'undefined'}`,
                }}
                suffix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              />
            </Form.Item>

            {/* Previsualización del nuevo código */}
            {livePreview && (
              <Form.Item
                label="Previsualización Nuevo Código"
                style={{ marginTop: '16px' }}
              >
                <PreviewContainer>
                  <PreviewText>{livePreview}</PreviewText>
                </PreviewContainer>
              </Form.Item>
            )}

            {/* Botón de generar */}
            <Form.Item style={{ marginTop: '24px' }}>
              <Button
                type="primary"
                size="large"
                icon={<ThunderboltOutlined />}
                onClick={handleGenerateCode}
                loading={loadingGenerate}
                disabled={autoMode ? false : !itemReferenceValid}
                style={{ width: '100%' }}
              >
                {autoMode
                  ? 'Generar Código Automáticamente'
                  : 'Generar Código Manual'}
              </Button>
            </Form.Item>
          </Form>
        </FormSection>
      </MainContent>

      {/* Vista previa lateral removida */}
    </Container>
  );
};

export default InternalModeTab;
