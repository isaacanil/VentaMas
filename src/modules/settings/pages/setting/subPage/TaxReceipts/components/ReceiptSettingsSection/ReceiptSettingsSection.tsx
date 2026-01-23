// File: src/components/TaxReceiptSetting/ReceiptSettingsSection.tsx
import { Switch, Typography } from 'antd';
import type { SwitchProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

import FiscalReceiptsAlertWidget from '../FiscalReceiptsAlertWidget/FiscalReceiptsAlertWidget';

const { Title, Text } = Typography;

interface ReceiptSettingsSectionProps {
  enabled: boolean;
  onToggle: SwitchProps['onChange'];
}

export function ReceiptSettingsSection({
  enabled,
  onToggle,
}: ReceiptSettingsSectionProps) {
  return (
    <Container>
      <SectionContainer>
        <Info>
          <Title level={4}>Opción para Deshabilitar Comprobantes</Title>
          <Text>Activa o desactiva los comprobantes en el punto de venta</Text>
        </Info>
        <Switch checked={enabled} onChange={onToggle} />
      </SectionContainer>

      <AlertsContainer>
        <FiscalReceiptsAlertWidget />
      </AlertsContainer>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionContainer = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const AlertsContainer = styled.div`
  padding: 16px;
  background-color: #f9f9f9;
  border-radius: 8px;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;

  > h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  > p {
    margin: 0;
    font-size: 14px;
    color: rgb(0 0 0 / 45%);
  }
`;
