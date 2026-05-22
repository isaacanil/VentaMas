import React from 'react';
import styled from 'styled-components';

import { VmCard, VmSwitch } from '@/components/heroui';

interface ReceiptSettingsSectionProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export function ReceiptSettingsSection({
  enabled,
  onToggle,
}: ReceiptSettingsSectionProps) {
  return (
    <SectionContainer>
      <Info>
        <Title>Habilitar emisión fiscal</Title>
        <Description>
          Controla si el negocio puede emitir NCF. Al desactivar, las ventas
          siguen operando pero sin comprobantes fiscales.
        </Description>
      </Info>
      <VmSwitch
        aria-label="Habilitar emisión fiscal"
        isSelected={enabled}
        onChange={onToggle}
      />
    </SectionContainer>
  );
}

const SectionContainer = styled(VmCard)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4);
  background: var(--ds-color-bg-surface);
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Title = styled.h4`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;
