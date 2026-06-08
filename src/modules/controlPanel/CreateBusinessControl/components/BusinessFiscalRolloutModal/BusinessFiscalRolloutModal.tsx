import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import styled from 'styled-components';

import {
  VmAlert,
  VmButton,
  VmForm,
  VmInput,
  VmModal,
  VmSwitch,
} from '@/components/heroui';
import { ExclamationCircleOutlined } from '@/constants/icons/antd';
import {
  fbUpdateBusinessFiscalRollout,
  type UpdateBusinessFiscalRolloutResponse,
} from '@/firebase/dev/businesses/fbUpdateBusinessFiscalRollout';

import type { BusinessInfo } from '../../types';

type BusinessFiscalRolloutModalProps = {
  business: BusinessInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (response: UpdateBusinessFiscalRolloutResponse) => void;
};

const FORM_ID = 'business-fiscal-rollout-form';

export const BusinessFiscalRolloutModal = ({
  business,
  isOpen,
  onClose,
  onUpdated,
}: BusinessFiscalRolloutModalProps) => {
  const initialReportingEnabled =
    business?.fiscalRollout.reportingEnabled === true;
  const initialMonthlyComplianceEnabled =
    business?.fiscalRollout.monthlyComplianceEnabled === true;

  const [reportingEnabled, setReportingEnabled] = useState(
    initialReportingEnabled,
  );
  const [monthlyComplianceEnabled, setMonthlyComplianceEnabled] = useState(
    initialMonthlyComplianceEnabled,
  );
  const [confirmation, setConfirmation] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmationMatches = confirmation.trim() === (business?.id || '');
  const confirmationInvalid = Boolean(confirmation) && !confirmationMatches;
  const hasChanges =
    reportingEnabled !== initialReportingEnabled ||
    monthlyComplianceEnabled !== initialMonthlyComplianceEnabled;
  const monthlyReady = reportingEnabled && monthlyComplianceEnabled;
  const canSubmit =
    Boolean(business?.id) &&
    confirmationMatches &&
    hasChanges &&
    !isSubmitting;

  const statusLabel = useMemo(() => {
    if (monthlyReady) return 'DGII mensual activo';
    if (reportingEnabled || monthlyComplianceEnabled) return 'Fiscal parcial';
    return 'Fiscal apagado';
  }, [monthlyComplianceEnabled, monthlyReady, reportingEnabled]);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    onClose();
  }, [isSubmitting, onClose]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleClose();
    },
    [handleClose],
  );

  const handleReportingChange = useCallback((enabled: boolean) => {
    setReportingEnabled(enabled);
    if (!enabled) {
      setMonthlyComplianceEnabled(false);
    }
  }, []);

  const handleMonthlyComplianceChange = useCallback((enabled: boolean) => {
    setMonthlyComplianceEnabled(enabled);
    if (enabled) {
      setReportingEnabled(true);
    }
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitAttempted(true);

      if (!business?.id || !confirmationMatches || !hasChanges) {
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fbUpdateBusinessFiscalRollout({
          businessId: business.id,
          reportingEnabled,
          monthlyComplianceEnabled,
        });
        message.success('Configuracion fiscal actualizada.');
        onUpdated?.(response);
        onClose();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar la configuracion fiscal.';
        message.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      business?.id,
      confirmationMatches,
      hasChanges,
      monthlyComplianceEnabled,
      onClose,
      onUpdated,
      reportingEnabled,
    ],
  );

  const footer = (
    <Actions>
      <VmButton
        variant="secondary"
        isDisabled={isSubmitting}
        onPress={handleClose}
      >
        Cancelar
      </VmButton>
      <VmButton
        type="submit"
        form={FORM_ID}
        variant="primary"
        isDisabled={!canSubmit}
        isPending={isSubmitting}
      >
        Guardar fiscal
      </VmButton>
    </Actions>
  );

  return (
    <VmModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Compliance DGII"
      ariaLabel="Compliance DGII del negocio"
      size="md"
      footer={footer}
      isKeyboardDismissDisabled={isSubmitting}
    >
      <Content>
        <SummaryGrid>
          <SummaryItem>
            <SummaryLabel>Negocio</SummaryLabel>
            <SummaryValue>
              {business?.name || 'Negocio sin nombre'}
            </SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>ID</SummaryLabel>
            <SummaryValue>{business?.id || '-'}</SummaryValue>
          </SummaryItem>
          <SummaryItem>
            <SummaryLabel>Estado</SummaryLabel>
            <SummaryValue>{statusLabel}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>

        <Notice status={monthlyReady ? 'accent' : 'warning'}>
          <NoticeIcon>
            <ExclamationCircleOutlined />
          </NoticeIcon>
          <VmAlert.Content>
            <VmAlert.Title>
              {monthlyReady
                ? 'El negocio podra generar 606, 607 y 608.'
                : 'El compliance mensual queda bloqueado si falta un flag.'}
            </VmAlert.Title>
          </VmAlert.Content>
        </Notice>

        <VmForm id={FORM_ID} onSubmit={handleSubmit}>
          <Fields>
            <SwitchField>
              <SwitchCopy>
                <FieldLabel>Reportes fiscales</FieldLabel>
                <FieldHint>features.fiscal.reportingEnabled</FieldHint>
              </SwitchCopy>
              <VmSwitch
                aria-label="Reportes fiscales"
                isSelected={reportingEnabled}
                isDisabled={isSubmitting}
                onChange={handleReportingChange}
              />
            </SwitchField>

            <SwitchField>
              <SwitchCopy>
                <FieldLabel>Compliance mensual</FieldLabel>
                <FieldHint>features.fiscal.monthlyComplianceEnabled</FieldHint>
              </SwitchCopy>
              <VmSwitch
                aria-label="Compliance mensual DGII"
                isSelected={monthlyComplianceEnabled}
                isDisabled={isSubmitting}
                onChange={handleMonthlyComplianceChange}
              />
            </SwitchField>

            <Field>
              <FieldLabel>Confirmar ID del negocio</FieldLabel>
              <ConfirmInput
                aria-label="Confirmar ID del negocio"
                value={confirmation}
                disabled={isSubmitting}
                placeholder={business?.id || 'ID del negocio'}
                onChange={(event) => setConfirmation(event.target.value)}
              />
              {submitAttempted && !confirmation ? (
                <ErrorText>Confirma el ID del negocio.</ErrorText>
              ) : null}
              {(submitAttempted || confirmationInvalid) &&
              confirmation &&
              !confirmationMatches ? (
                <ErrorText>El ID escrito no coincide con el negocio.</ErrorText>
              ) : null}
              {submitAttempted && !hasChanges ? (
                <ErrorText>No hay cambios pendientes.</ErrorText>
              ) : null}
            </Field>
          </Fields>
        </VmForm>
      </Content>
    </VmModal>
  );
};

const Content = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const SummaryGrid = styled.dl`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
  padding: var(--ds-space-3);
  border-right: 1px solid var(--ds-color-border-default);

  &:last-child {
    border-right: 0;
  }

  @media (max-width: 680px) {
    border-right: 0;
    border-bottom: 1px solid var(--ds-color-border-default);

    &:last-child {
      border-bottom: 0;
    }
  }
`;

const SummaryLabel = styled.dt`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const SummaryValue = styled.dd`
  min-width: 0;
  margin: 0;
  overflow: hidden;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Notice = styled(VmAlert)`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--ds-space-3);
  align-items: flex-start;
  padding: var(--ds-space-3);
`;

const NoticeIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  color: currentcolor;
`;

const Fields = styled.div`
  display: grid;
  gap: var(--ds-space-4);
`;

const Field = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const SwitchField = styled.div`
  display: flex;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
`;

const SwitchCopy = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  min-width: 0;
`;

const FieldLabel = styled.label`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

const FieldHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-xs);
`;

const ConfirmInput = styled(VmInput)`
  width: 100%;
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--ds-color-danger, #b91c1c);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;
`;
