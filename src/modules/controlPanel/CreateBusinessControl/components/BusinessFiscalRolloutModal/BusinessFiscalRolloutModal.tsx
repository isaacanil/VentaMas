import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import styled from 'styled-components';

import { VmAlert, VmForm, VmModal, VmSwitch } from '@/components/heroui';
import { ExclamationCircleOutlined } from '@/constants/icons/antd';
import {
  fbUpdateBusinessFiscalRollout,
  type UpdateBusinessFiscalRolloutResponse,
} from '@/firebase/dev/businesses/fbUpdateBusinessFiscalRollout';

import type { BusinessInfo } from '../../types';
import {
  AdminBusinessActionFooter,
  AdminBusinessConfirmationField,
  AdminBusinessErrorText,
  AdminBusinessFieldLabel,
  AdminBusinessModalContent,
  AdminBusinessNotice,
  AdminBusinessNoticeIcon,
  AdminBusinessSummary,
} from '../AdminBusinessActionModal';

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
    Boolean(business?.id) && confirmationMatches && hasChanges && !isSubmitting;

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
    <AdminBusinessActionFooter
      canSubmit={canSubmit}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      submitLabel="Guardar fiscal"
    />
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
      <AdminBusinessModalContent>
        <AdminBusinessSummary
          businessId={business?.id}
          businessName={business?.name}
          statusTitle="Estado"
          statusLabel={statusLabel}
        />

        <AdminBusinessNotice status={monthlyReady ? 'accent' : 'warning'}>
          <AdminBusinessNoticeIcon>
            <ExclamationCircleOutlined />
          </AdminBusinessNoticeIcon>
          <VmAlert.Content>
            <VmAlert.Title>
              {monthlyReady
                ? 'El negocio podra generar 606, 607 y 608.'
                : 'El compliance mensual queda bloqueado si falta un flag.'}
            </VmAlert.Title>
          </VmAlert.Content>
        </AdminBusinessNotice>

        <VmForm id={FORM_ID} onSubmit={handleSubmit}>
          <Fields>
            <SwitchField>
              <SwitchCopy>
                <AdminBusinessFieldLabel $tone="primary">
                  Reportes fiscales
                </AdminBusinessFieldLabel>
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
                <AdminBusinessFieldLabel $tone="primary">
                  Compliance mensual
                </AdminBusinessFieldLabel>
                <FieldHint>features.fiscal.monthlyComplianceEnabled</FieldHint>
              </SwitchCopy>
              <VmSwitch
                aria-label="Compliance mensual DGII"
                isSelected={monthlyComplianceEnabled}
                isDisabled={isSubmitting}
                onChange={handleMonthlyComplianceChange}
              />
            </SwitchField>

            <AdminBusinessConfirmationField
              businessId={business?.id}
              confirmationInvalid={confirmationInvalid}
              isSubmitting={isSubmitting}
              labelTone="primary"
              submitAttempted={submitAttempted}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            >
              {submitAttempted && !hasChanges ? (
                <AdminBusinessErrorText>
                  No hay cambios pendientes.
                </AdminBusinessErrorText>
              ) : null}
            </AdminBusinessConfirmationField>
          </Fields>
        </VmForm>
      </AdminBusinessModalContent>
    </VmModal>
  );
};

const Fields = styled.div`
  display: grid;
  gap: var(--ds-space-4);
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

const FieldHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-family: var(--ds-font-family-mono, monospace);
  font-size: var(--ds-font-size-xs);
`;
