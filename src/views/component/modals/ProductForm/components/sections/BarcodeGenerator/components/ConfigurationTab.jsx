import { Input, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

const Label = styled.label`
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
`;

const ErrorMessage = styled.div`
  margin-top: 4px;
  font-size: 12px;
  color: #ff4d4f;
`;

export const ConfigurationTab = ({
  selectedConfig,
  handleCompanyPrefixChange,
  companyPrefixConfigValid,
}) => {
  const getValidationStatus = () => {
    const value = selectedConfig?.companyPrefix || '';

    if (!value) return { status: '', message: '' };

    // Solo números
    if (!/^\d+$/.test(value)) {
      return {
        status: 'error',
        message: 'Solo se permiten números',
      };
    }

    // Longitud mínima
    if (value.length < 4) {
      return {
        status: 'error',
        message: `Mínimo 4 dígitos (tienes ${value.length})`,
      };
    }

    // Longitud máxima
    if (value.length > 7) {
      return {
        status: 'error',
        message: `Máximo 7 dígitos (tienes ${value.length})`,
      };
    }

    // Válido - también verificar con la validación del padre
    if (companyPrefixConfigValid) {
      return {
        status: 'success',
        message: `✓ Configuración válida (${value.length} dígitos)`,
      };
    }

    return { status: '', message: '' };
  };

  const validation = getValidationStatus();

  return (
    <div style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: '20px' }}>
        <Label>
          Prefijo de Empresa
          <Tooltip
            title="Número de identificación de tu empresa (4-7 dígitos)"
            style={{ marginLeft: '4px' }}
          />
        </Label>
        <Input
          placeholder="Ej: 4887"
          value={selectedConfig?.companyPrefix || ''}
          onChange={handleCompanyPrefixChange}
          maxLength={7}
          status={validation.status === 'error' ? 'error' : undefined}
          style={{
            fontFamily: 'monospace',
            fontSize: '16px',
            padding: '8px 12px',
          }}
        />
        {validation.message && (
          <ErrorMessage
            style={{
              color: `${validation.status === 'error' ? '#ff4d4f' : '#52c41a'}`,
            }}
          >
            {validation.message}
          </ErrorMessage>
        )}
      </div>
    </div>
  );
};

export default ConfigurationTab;
