import { Form, Typography, Space, Tag } from 'antd';
import React from 'react';
import Barcode from 'react-barcode';
import styled from 'styled-components';

import { isGS1RDCode } from '../../../../../../../../utils/barcode/barcode';

const { Text } = Typography;

const PreviewContainer = styled.div`
  padding: 12px 16px;
  background: #f0f2f5;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  text-align: center;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #1890ff;
    background: #f6f8fa;
  }
`;

const CurrentCodeContainer = styled.div`
  padding: 16px;
  background: #fff7e6;
  border: 2px solid #ffd666;
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
`;

const InfoSection = styled.div`
  padding: 12px 0;
  border-top: 1px solid #f0f0f0;
  margin-top: 16px;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  font-size: 12px;
  color: #595959;
`;

const InfoLabel = styled.div`
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
`;

const InfoValue = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
  color: #595959;
  text-align: right;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: ${props => props.valid ? '#f6ffed' : '#fff2e8'};
  color: ${props => props.valid ? '#52c41a' : '#fa8c16'};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
`;

const StatusText = styled.div`
  font-size: 12px;
  color: #8c8c8c;
  margin-top: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const PreviewText = styled.div`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: bold;
  color: #1890ff;
  letter-spacing: 2px;
`;

// Exportar los styled-components para usar en otros componentes
export { PreviewContainer, PreviewText };

export const BarcodePreview = ({ 
  autoMode, 
  selectedConfig, 
  nextItemReference, 
  livePreview,
  currentBarcode,
  realtimeStatus = {},
  barcodeAnalysis = null,
  isInternalMode = false
}) => {
  const showPreview = livePreview || (autoMode && (selectedConfig?.companyPrefix || isInternalMode));
  const { isConnected, isUpdating, hasRealtimeData, hasManualChanges } = realtimeStatus;
  
  return (
    <div>
      {/* Mostrar código actual si existe */}
      {currentBarcode && (
        <>
          <Form.Item 
            label={
              <Space>
                Código Actual
                {hasRealtimeData && (
                  <Text type="secondary" style={{ fontSize: '11px' }}>
                
                    {isUpdating && <span style={{ color: '#1890ff' }}> (Actualizando...)</span>}
                    {hasManualChanges && <span style={{ color: '#fa8c16' }}> • Cambio manual</span>}
                  </Text>
                )}
              </Space>
            } 
            style={{ marginBottom: 16 }}
          >
            <CurrentCodeContainer style={{ 
              borderColor: hasManualChanges ? '#fa8c16' : isUpdating ? '#1890ff' : '#ffd666',
              background: hasManualChanges ? '#fff7e6' : isUpdating ? '#f0f8ff' : '#fff7e6'
            }}>
              <Space direction="vertical" align="center" style={{ width: '100%' }}>
                <Text style={{ 
                  fontFamily: 'monospace', 
                  fontSize: '16px', 
                  fontWeight: 'bold',
                  color: hasManualChanges ? '#fa8c16' : isUpdating ? '#1890ff' : 'inherit'
                }}>
                  {currentBarcode}
                </Text>
                <Barcode
                  value={currentBarcode}
                  width={1.5}
                  height={40}
                  displayValue={false}
                  fontSize={12}
                />
                <StatusText>
                  {hasManualChanges ? (
                    <>
                      <span>✏️</span>
                      <span>Código modificado manualmente (no guardado)</span>
                    </>
                  ) : isUpdating ? (
                    <>
                      <span>🔄</span>
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <span>📋</span>
                      <span>Este es el código actual del producto</span>
                    </>
                  )}
                </StatusText>
              </Space>
            </CurrentCodeContainer>
          </Form.Item>

          {/* Información detallada del código - Fuera del contenedor */}
          {currentBarcode && barcodeAnalysis && (
            <InfoSection>
              <InfoGrid>
                <InfoLabel>Estado:</InfoLabel>
                <InfoValue>
                  <StatusBadge valid={barcodeAnalysis.checkDigit?.isValid}>
                    {barcodeAnalysis.checkDigit?.isValid ? 'Válido' : 'Requiere revisión'}
                  </StatusBadge>
                </InfoValue>

                <InfoLabel>Formato:</InfoLabel>
                <InfoValue>{barcodeAnalysis.type || 'Desconocido'}</InfoValue>

                {barcodeAnalysis.country && (
                  <>
                    <InfoLabel>País:</InfoLabel>
                    <InfoValue>{barcodeAnalysis.country.country}</InfoValue>
                  </>
                )}

                <InfoLabel>Longitud:</InfoLabel>
                <InfoValue>{currentBarcode.length} dígitos</InfoValue>

                {/* Detalles de estructura para códigos GS1 RD o internos */}
                {barcodeAnalysis.structure && (isGS1RDCode(currentBarcode) || isInternalMode) && (
                  <>
                    <InfoLabel>{isInternalMode ? 'Categoría/Depto:' : 'Prefijo empresa:'}</InfoLabel>
                    <InfoValue>{barcodeAnalysis.structure.companyPrefix || 'N/A'}</InfoValue>

                    <InfoLabel>Referencia:</InfoLabel>
                    <InfoValue>{barcodeAnalysis.structure.itemReference}</InfoValue>

                    <InfoLabel>Dígito verificador:</InfoLabel>
                    <InfoValue>{barcodeAnalysis.structure.checkDigit}</InfoValue>
                  </>
                )}

                {/* Indicador de modo interno */}
                {isInternalMode && (
                  <>
                    <InfoLabel>Modo:</InfoLabel>
                    <InfoValue>
                      <Tag color="orange" size="small">USO INTERNO</Tag>
                    </InfoValue>
                  </>
                )}
              </InfoGrid>
            </InfoSection>
          )}
        </>
      )}

      {/* Si no hay preview y no hay código actual */}
      {!showPreview && !currentBarcode && (
        <Form.Item label="Vista Previa" style={{ marginTop: 24 }}>
          <PreviewContainer>
            <PreviewText style={{ color: '#8c8c8c' }}>
              Completa los campos para ver la previsualización
            </PreviewText>
          </PreviewContainer>
        </Form.Item>
      )}
    </div>
  );
};

export default BarcodePreview;
