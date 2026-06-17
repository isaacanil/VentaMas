import { Input, Tooltip } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { BarcodeSettings } from '@/domain/barcode/types';

import { getCompanyPrefixValidationStatus } from '../utils/barcodeGeneratorConfig';

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

type ConfigurationTabProps = {
  selectedConfig?: BarcodeSettings | null;
  handleCompanyPrefixChange: (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  companyPrefixConfigValid: boolean;
};

export const ConfigurationTab = ({
  selectedConfig,
  handleCompanyPrefixChange,
  companyPrefixConfigValid,
}: ConfigurationTabProps) => {
  const validation = getCompanyPrefixValidationStatus(
    selectedConfig?.companyPrefix || '',
    companyPrefixConfigValid,
  );

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
