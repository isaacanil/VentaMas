import { InfoCircleOutlined, ThunderboltOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { Form, Input, Button, Space, Typography, Checkbox, Tooltip, Select } from 'antd';
import React from 'react';
import styled from 'styled-components';

const { Text } = Typography;

// Contenedores con layout responsive
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  
  @media (min-width: 1024px) {
    flex-direction: row;
    gap: 24px;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

// Eliminado: vista previa embebida (ahora se muestra en un modal externo)

const Section = styled.div`
  border: 1px solid #eaeaea;
  padding: 16px;
  border-radius: 4px;
`;

const SectionHeader = styled.h3`
  margin: 0 0 12px;
  font-size: 1.1rem;
`;

const FieldRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

// Contenedor para alinear el label y la acción de "Editar Configuración"
const LabelWithAction = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  width: 100%;
`;

export const GenerateTab = ({
  form,
  isConfigured,
  autoMode,
  setAutoMode,
  manualValues,
  internalManualValues,
  selectedConfig,
  companyPrefixValid,
  itemReferenceValid,
  handleManualItemReferenceChange,
  handleInternalItemReferenceChange,
  nextItemReference,
  livePreview,
  handleGenerateCode,
  loadingGenerate,
  generatedCode,
  onOpenConfig,
  selectedStandard,
  onStandardChange,
  currentBarcode,
  realtimeStatus = {},
  barcodeAnalysis = null,
  useCompanyPrefix,
  setUseCompanyPrefix,
  hideGenerateButton = false
}) => {
  // Map of GS1 prefixes per standard
  const standardPrefixes = {
    gs1rd: '746',
    gs1us: '0',
    gs1mx: '750',
    gs1co: '770',
    gs1ar: '778',
    gs1cl: '780',
    gs1pe: '775',
  };
  const hasCompanyPrefix = !!selectedConfig?.companyPrefix;
  return (
    <Container>
   
          <MainContent>
              <Form form={form} layout="vertical" style={{ width: '100%' }}>
              <Form.Item label="País">
            <Select value={selectedStandard} onChange={onStandardChange}>
              <Select.Option value="gs1rd">República Dominicana (746)</Select.Option>
              <Select.Option value="gs1us">Estados Unidos/Canadá (0)</Select.Option>
              <Select.Option value="gs1mx">México (750)</Select.Option>
              <Select.Option value="gs1co">Colombia (770)</Select.Option>
              <Select.Option value="gs1ar">Argentina (778)</Select.Option>
              <Select.Option value="gs1cl">Chile (780)</Select.Option>
              <Select.Option value="gs1pe">Perú (775)</Select.Option>
            </Select>
          </Form.Item>

              <Form.Item style={{ marginBottom: 8 }}>
                <Checkbox
                  checked={useCompanyPrefix}
                  onChange={(e) => setUseCompanyPrefix(e.target.checked)}
                >
                  <Space>
                    <Text>Usar prefijo empresarial</Text>
                    <Tooltip title={hasCompanyPrefix ? 'Usar tu prefijo registrado para códigos oficiales' : 'Configura tu prefijo para códigos oficiales'}>
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                </Checkbox>
              </Form.Item>
              {/* Checkbox para modo automático (solo visible cuando se usa GS1) */}

              {/* Company Prefix + referencia si está activo; si no, solo referencia interna */}
              {useCompanyPrefix ? (
                <>
                  <Form.Item 
                    label={(
                      <LabelWithAction>
                         <span>Prefijo empresarial</span>
                        <Button type="link" onClick={onOpenConfig} style={{ padding: 0 }}>
                          Configurar
                        </Button>
                      </LabelWithAction>
                    )}
                    validateStatus={selectedConfig?.companyPrefix ? 'success' : ''}
                    help={!selectedConfig?.companyPrefix ? 'Haz clic en "Configurar" para establecer tu prefijo' : `${selectedConfig.companyPrefixLength} dígitos - ${selectedConfig.maxProducts?.toLocaleString()} productos máximo`}
                  >
                    <Input
                      value={selectedConfig?.companyPrefix ?? ''}
                      readOnly={true}
                      placeholder="Sin configurar"
                      style={{ 
                        fontFamily: 'monospace', 
                        fontSize: '16px', 
                        fontWeight: 'bold',
                        backgroundColor: '#f5f5f5',
                        cursor: 'not-allowed'
                      }}
                      suffix={selectedConfig?.companyPrefix ? <CheckCircleOutlined style={{ color: '#52c41a' }} /> : null}
                    />
                  </Form.Item>

                  <Form.Item style={{ marginBottom: 16 }}>
                <Checkbox 
                  checked={autoMode} 
                  onChange={(e) => setAutoMode(e.target.checked)}
                >
                  <Space>
                    <Text>Generar automáticamente</Text>
                    <Tooltip title="El sistema asigna el siguiente número disponible">
                      <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    </Tooltip>
                  </Space>
                </Checkbox>
              </Form.Item>

                  <Form.Item 
                    label="Referencia"
                    validateStatus={!autoMode && itemReferenceValid === false ? 'error' : !autoMode && itemReferenceValid === true ? 'success' : ''}
                    help={!autoMode && itemReferenceValid === false ? `Debe tener ${selectedConfig?.itemReferenceLength} dígitos` : ''}
                  >
                    <Input
                      key={autoMode ? 'item-ref-auto' : 'item-ref-manual'}
                      value={autoMode ? nextItemReference : manualValues.itemReference}
                      readOnly={autoMode}
                      onChange={!autoMode ? (e) => handleManualItemReferenceChange(e.target.value) : undefined}
                      placeholder={autoMode ? undefined : `${selectedConfig?.itemReferenceLength} dígitos`}
                      maxLength={selectedConfig?.itemReferenceLength}
                      style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', backgroundColor: autoMode ? '#f6ffed' : undefined }}
                      suffix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    />
                  </Form.Item>
                </>
              ) : (
                <>
                  <Form.Item style={{ marginBottom: 0 }}>
                    <Checkbox 
                      checked={autoMode} 
                      onChange={(e) => setAutoMode(e.target.checked)}
                    >
                      <Space>
                        <Text>Generar automáticamente</Text>
                        <Tooltip title="El sistema asigna el siguiente número disponible">
                          <InfoCircleOutlined style={{ color: '#1890ff' }} />
                        </Tooltip>
                      </Space>
                    </Checkbox>
                  </Form.Item>

                  <Form.Item 
                    label="Referencia"
                    validateStatus={!autoMode && itemReferenceValid === false ? 'error' : !autoMode && itemReferenceValid === true ? 'success' : ''}
                    help={!autoMode && itemReferenceValid === false ? 'Debe tener 9 dígitos' : ''}
                  >
                    <Input
                      key={autoMode ? 'item-ref-auto' : 'item-ref-manual'}
                      value={autoMode ? nextItemReference : internalManualValues?.itemReference}
                      readOnly={autoMode}
                      onChange={!autoMode ? (e) => handleInternalItemReferenceChange(e.target.value) : undefined}
                      placeholder={autoMode ? undefined : '9 dígitos (ej: 000000001)'}
                      maxLength={9}
                      style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 'bold', backgroundColor: autoMode ? '#f6ffed' : undefined }}
                      suffix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    />
                  </Form.Item>
                </>
              )}
                {/* Vista previa removida: se mostrará en un modal aparte */}
                {/* Botón de generar */}
                {!hideGenerateButton && (
                  <Form.Item style={{ marginTop: 24 }}>
                    <Button
                      type="primary"
                      size="large"
                      icon={<ThunderboltOutlined />}
                      onClick={handleGenerateCode}
                      loading={loadingGenerate}
                      disabled={autoMode ? (useCompanyPrefix ? !selectedConfig?.companyPrefix : false) : (useCompanyPrefix ? !(companyPrefixValid && itemReferenceValid) : !itemReferenceValid)}
                      style={{ width: '100%' }}
                    >
                      {autoMode ? 'Generar Automático' : 'Generar Manual'}
                    </Button>
                    {loadingGenerate && (
                      <Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
                        Generando código...
                      </Text>
                    )}
                  </Form.Item>
                )}
              </Form>
           
          </MainContent>
  
    </Container>
  );
};

export default GenerateTab;
