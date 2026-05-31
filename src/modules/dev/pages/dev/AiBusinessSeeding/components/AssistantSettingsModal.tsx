import {
  faPlug,
  faStethoscope,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { VmButton, VmModal, VmSwitch } from '@/components/heroui';

const SettingsContent = styled.div`
  display: grid;
  gap: 18px;
  min-width: min(100%, 420px);
`;

const SettingsSection = styled.section`
  display: grid;
  gap: 10px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-muted, #6b7280);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
`;

const ProductionTargetPanel = styled.div<{ $active?: boolean }>`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  width: 100%;
  gap: 12px;
  padding: 12px;
  border: 1px solid
    ${({ $active }) => {
      if ($active) return 'rgb(220 38 38 / 35%)';
      return 'var(--ds-color-border-default, #e5e7eb)';
    }};
  border-radius: 14px;
  background: ${({ $active }) => {
    if ($active) return 'rgb(220 38 38 / 7%)';
    return 'var(--ds-color-bg-surface, #fff)';
  }};
  color: var(--ds-color-text-primary, #111827);
`;

const OptionIcon = styled.span<{ $danger?: boolean; $muted?: boolean }>`
  display: inline-grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 999px;
  color: ${({ $danger, $muted }) => {
    if ($danger) return 'var(--ds-color-state-danger, #dc2626)';
    if ($muted) return 'var(--ds-color-text-muted, #64748b)';
    return 'var(--ds-color-action-primary, #1677ff)';
  }};
  background: ${({ $danger, $muted }) => {
    if ($danger) return 'rgb(220 38 38 / 10%)';
    if ($muted) return 'rgb(100 116 139 / 10%)';
    return 'rgb(22 119 255 / 10%)';
  }};
`;

const OptionCopy = styled.span`
  display: grid;
  min-width: 0;
  gap: 3px;
`;

const OptionLabel = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-primary, #111827);
  font-size: 15px;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const OptionMeta = styled.span`
  overflow: hidden;
  color: var(--ds-color-text-secondary, #475569);
  font-size: 12px;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const SettingsPanel = styled.div`
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ds-color-border-default, #e5e7eb);
  border-radius: 14px;
  background: var(--ds-color-bg-subtle, #f8fafc);

  @media (max-width: 520px) {
    grid-template-columns: 34px minmax(0, 1fr);

    > button {
      grid-column: 2;
      justify-self: start;
    }
  }
`;

interface AssistantSettingsModalProps {
  isOpen: boolean;
  isProductionTargetEnabled: boolean;
  isProductionTargetConnected: boolean;
  productionTargetLabel?: string | null;
  loading?: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onToggleProductionTarget: (isEnabled: boolean) => void;
  onConnectProduction: () => void;
  onCheckStatus: () => void;
}

const getProductionTargetMeta = ({
  isProductionTargetEnabled,
  isProductionTargetConnected,
}: {
  isProductionTargetEnabled: boolean;
  isProductionTargetConnected: boolean;
}) => {
  if (isProductionTargetEnabled && isProductionTargetConnected) {
    return 'Activo y conectado';
  }
  if (isProductionTargetEnabled) return 'Activo, requiere conexion';
  if (isProductionTargetConnected) return 'Apagado, conexion disponible';
  return 'Apagado, usa staging';
};

const AssistantSettingsModal: React.FC<AssistantSettingsModalProps> = ({
  isOpen,
  isProductionTargetEnabled,
  isProductionTargetConnected,
  productionTargetLabel,
  loading = false,
  onOpenChange,
  onToggleProductionTarget,
  onConnectProduction,
  onCheckStatus,
}) => (
  <VmModal
    ariaLabel="Configuracion del asistente"
    isOpen={isOpen}
    onOpenChange={onOpenChange}
    title="Configuracion"
    size="md"
    footer={
      <VmButton
        size="sm"
        variant="secondary"
        onPress={() => onOpenChange(false)}
      >
        Cerrar
      </VmButton>
    }
  >
    <SettingsContent>
      <SettingsSection>
        <SectionTitle>Destino</SectionTitle>
        <ProductionTargetPanel $active={isProductionTargetEnabled}>
          <OptionIcon $danger={isProductionTargetEnabled}>
            <FontAwesomeIcon icon={faTriangleExclamation} />
          </OptionIcon>
          <OptionCopy>
            <OptionLabel>Produccion como destino</OptionLabel>
            <OptionMeta>
              {getProductionTargetMeta({
                isProductionTargetEnabled,
                isProductionTargetConnected,
              })}
            </OptionMeta>
          </OptionCopy>
          <VmSwitch
            aria-label="Produccion como destino"
            isSelected={isProductionTargetEnabled}
            onChange={onToggleProductionTarget}
          />
        </ProductionTargetPanel>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Produccion</SectionTitle>
        <SettingsPanel>
          <OptionIcon $danger={!isProductionTargetConnected}>
            <FontAwesomeIcon icon={faPlug} />
          </OptionIcon>
          <OptionCopy>
            <OptionLabel>Conexion persistente</OptionLabel>
            <OptionMeta>
              {isProductionTargetConnected
                ? `Conectado${productionTargetLabel ? `: ${productionTargetLabel}` : ''}`
                : 'Sin conexion'}
            </OptionMeta>
          </OptionCopy>
          <VmButton
            size="sm"
            variant={isProductionTargetConnected ? 'secondary' : 'primary'}
            onPress={onConnectProduction}
          >
            {isProductionTargetConnected ? 'Reconectar' : 'Conectar'}
          </VmButton>
        </SettingsPanel>
      </SettingsSection>

      <SettingsSection>
        <SectionTitle>Flujo</SectionTitle>
        <SettingsPanel>
          <OptionIcon $muted>
            <FontAwesomeIcon icon={faStethoscope} />
          </OptionIcon>
          <OptionCopy>
            <OptionLabel>Diagnostico asistente</OptionLabel>
            <OptionMeta>Modelo, esquema y permisos</OptionMeta>
          </OptionCopy>
          <VmButton
            isDisabled={loading}
            isPending={loading}
            size="sm"
            variant="secondary"
            onPress={onCheckStatus}
          >
            Ejecutar
          </VmButton>
        </SettingsPanel>
      </SettingsSection>
    </SettingsContent>
  </VmModal>
);

export default AssistantSettingsModal;
