import {
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  BulbOutlined,
  CopyOutlined,
} from '@ant-design/icons';
import * as ant from 'antd';
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

import {
  getBarcodeInfo,
  generateCorrectionSuggestions,
} from '../../../../../../../utils/barcode/barcode';

const { Modal, Space, Button, Alert } = ant;

// Styled Components
const WorkingCodeSection = styled.div`
  margin-bottom: 24px;
`;

const WorkingCodeLabel = styled.div`
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`;

const WorkingCodeContainer = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
`;

const WorkingCodeValue = styled.div`
  flex: 1;
  font-family: 'JetBrains Mono', 'Fira Code', Monaco, monospace;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
`;

const StatusBadge = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  font-size: 12px;
  font-weight: 500;
  color: #52c41a;
`;

const FormatBadge = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #1890ff;
`;

const CopyIconButton = styled.button`
  display: flex;
  align-items: center;
  padding: 4px;
  color: #8c8c8c;
  cursor: pointer;
  background: none;
  border: none;
  border-radius: 4px;

  &:hover {
    color: #1890ff;
    background: #f5f5f5;
  }
`;

const SuggestionsSection = styled.div`
  margin-top: 32px;
`;

const SectionTitle = styled.div`
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`;

const SuggestionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SuggestionCard = styled.div`
  padding: 16px;
  cursor: pointer;
  background: ${({ $selected }) => ($selected ? '#e6f7ff' : '#fafafa')};
  border: 1px solid ${({ $selected }) => ($selected ? '#1890ff' : '#f0f0f0')};
  border-radius: 6px;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ $selected }) => ($selected ? '#e6f7ff' : '#f5f5f5')};
    border-color: ${({ $selected }) => ($selected ? '#1890ff' : '#d9d9d9')};
  }
`;

const SuggestionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
`;

const SuggestionTitle = styled.div`
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`;

const SuggestionCode = styled.div`
  margin-bottom: 4px;
  font-family: 'JetBrains Mono', 'Fira Code', Monaco, monospace;
  font-size: 15px;
  font-weight: 600;
  color: #1890ff;
  letter-spacing: 0.3px;
`;

const SuggestionDescription = styled.div`
  font-size: 12px;
  line-height: 1.4;
  color: #8c8c8c;
`;

export const BarcodeCorrector = ({
  visible,
  onClose,
  currentBarcode,
  onApplyCorrection,
}) => {
  const [workingCode, setWorkingCode] = useState(currentBarcode || '');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);

  useEffect(() => {
    setWorkingCode(currentBarcode || '');
    setSelectedSuggestion(null);
  }, [currentBarcode, visible]);

  useEffect(() => {
    if (workingCode) {
      const allSuggestions = generateCorrectionSuggestions(workingCode);
      // Filtrar solo las sugerencias relacionadas con dígitos verificadores
      const checkDigitSuggestions = allSuggestions.filter(
        (suggestion) =>
          suggestion.reason === 'fix' || suggestion.reason === 'complete',
      );

      // Convertir el formato de las sugerencias para que coincida con el UI
      const uiSuggestions = checkDigitSuggestions.map((suggestion) => ({
        ...suggestion,
        icon:
          suggestion.reason === 'fix' ? (
            <ExclamationCircleOutlined />
          ) : (
            <BulbOutlined />
          ),
      }));
      setSuggestions(uiSuggestions);
    } else {
      setSuggestions([]);
    }
    setSelectedSuggestion(null);
  }, [workingCode]);

  const handleSelectSuggestion = (suggestion) => {
    setSelectedSuggestion(
      selectedSuggestion?.id === suggestion.id ? null : suggestion,
    );
  };

  const handleApplyCorrection = () => {
    const codeToApply = selectedSuggestion
      ? selectedSuggestion.code
      : workingCode;
    onApplyCorrection(codeToApply);
    ant.notification.success({
      message: 'Código Aplicado',
      description: `Se aplicó el código: ${codeToApply}`,
      duration: 3,
    });
    onClose();
  };

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    ant.message.success('Código copiado al portapapeles');
  };

  const barcodeInfo = workingCode ? getBarcodeInfo(workingCode) : null;

  return (
    <Modal
      title={
        <Space>
          <BulbOutlined />
          Corrector de Dígito Verificador
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancelar
        </Button>,
        <Button
          key="apply"
          type="primary"
          onClick={handleApplyCorrection}
          disabled={!workingCode && !selectedSuggestion}
        >
          Aplicar
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* Código de trabajo */}
        <WorkingCodeSection>
          <WorkingCodeLabel>Código de trabajo</WorkingCodeLabel>
          <WorkingCodeContainer>
            <WorkingCodeValue>{workingCode}</WorkingCodeValue>
            {workingCode && barcodeInfo && (
              <>
                <StatusBadge>
                  <CheckCircleOutlined />
                  {barcodeInfo.valid ? 'Válido' : 'Revisar'}
                </StatusBadge>
                <FormatBadge>{barcodeInfo.type || 'Desconocido'}</FormatBadge>
              </>
            )}
            {workingCode && (
              <CopyIconButton onClick={() => handleCopyCode(workingCode)}>
                <CopyOutlined />
              </CopyIconButton>
            )}
          </WorkingCodeContainer>
        </WorkingCodeSection>

        {/* Sugerencias de corrección de dígito verificador */}
        {suggestions.length > 0 && (
          <SuggestionsSection>
            <SectionTitle>Correcciones de dígito verificador</SectionTitle>
            <SuggestionsContainer>
              {suggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  $selected={selectedSuggestion?.id === suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                >
                  <SuggestionHeader>
                    <SuggestionTitle>{suggestion.type}</SuggestionTitle>
                    <CopyIconButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(suggestion.code);
                      }}
                    >
                      <CopyOutlined />
                    </CopyIconButton>
                  </SuggestionHeader>

                  <SuggestionCode>{suggestion.code}</SuggestionCode>

                  <SuggestionDescription>
                    {suggestion.description}
                  </SuggestionDescription>
                </SuggestionCard>
              ))}
            </SuggestionsContainer>
          </SuggestionsSection>
        )}

        {/* Información educativa */}
        {suggestions.length === 0 && workingCode && (
          <Alert
            message="Dígito verificador correcto"
            description="El código tiene un dígito verificador válido o no requiere correcciones."
            type="success"
            showIcon
          />
        )}

        {!workingCode && (
          <Alert
            message="Corrector de Dígito Verificador"
            description="Ingresa un código de barras para validar y corregir automáticamente el dígito verificador. Compatible con GTIN-13, EAN-13, UPC-A, EAN-8 y GTIN-14."
            type="info"
            showIcon
          />
        )}
      </Space>
    </Modal>
  );
};
