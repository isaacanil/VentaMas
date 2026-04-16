// File: src/components/TaxReceiptSetting/ReceiptSettingsSection.tsx
import { Switch, Typography } from 'antd';
import type { SwitchProps } from 'antd';
import React from 'react';
import styled from 'styled-components';

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
    <SectionContainer>
      <Info>
        <Title level={4}>Habilitar emisión fiscal</Title>
        <Text>
          Controla si el negocio puede emitir NCF. Al desactivar, las ventas
          siguen operando pero sin comprobantes fiscales.
        </Text>
      </Info>
      <Switch checked={enabled} onChange={onToggle} />
    </SectionContainer>
  );
}

const SectionContainer = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
  justify-content: space-between;
  padding: var(--ds-space-4);
  background-color: var(--ds-color-bg-subtle);
  border-radius: var(--ds-radius-lg);
  border: 1px solid var(--ds-color-border-subtle);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;

  > h4 {
    margin: 0;
    font-size: var(--ds-font-size-md);
    font-weight: var(--ds-font-weight-semibold);
  }

  > p {
    margin: 0;
    font-size: var(--ds-font-size-sm);
    color: var(--ds-color-text-secondary);
  }
`;
