import type { FormEvent, Key } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import styled from 'styled-components';

import {
  VmAlert,
  VmForm,
  VmListBox,
  VmModal,
  VmSelect,
  VmTextArea,
} from '@/components/heroui';
import { ExclamationCircleOutlined } from '@/constants/icons/antd';
import {
  BUSINESS_ACCESS_STATUS_OPTIONS,
  fbUpdateBusinessAccess,
  type BusinessAccessStatus,
  type UpdateBusinessAccessResponse,
} from '@/firebase/dev/businesses/fbUpdateBusinessAccess';

import type { BusinessInfo } from '../../types';
import { getBusinessAccessStatusDisplay } from '../../utils/businessStatusDisplay';
import {
  AdminBusinessActionFooter,
  AdminBusinessConfirmationField,
  AdminBusinessErrorText,
  AdminBusinessField,
  AdminBusinessFieldLabel,
  AdminBusinessModalContent,
  AdminBusinessNotice,
  AdminBusinessNoticeDescription,
  AdminBusinessNoticeIcon,
  AdminBusinessSummary,
} from '../AdminBusinessActionModal';

type BusinessAccessActionsModalProps = {
  business: BusinessInfo | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdated?: (response: UpdateBusinessAccessResponse) => void;
};

const BLOCKING_STATUSES = new Set<BusinessAccessStatus>([
  'suspended',
  'inactive',
  'offboarded',
  'closed',
]);

const DEFAULT_STATUS: BusinessAccessStatus = 'suspended';
const FORM_ID = 'business-access-actions-form';

export const BusinessAccessActionsModal = ({
  business,
  isOpen,
  onClose,
  onUpdated,
}: BusinessAccessActionsModalProps) => {
  const [status, setStatus] = useState<BusinessAccessStatus>(DEFAULT_STATUS);
  const [reason, setReason] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedOption = useMemo(
    () =>
      BUSINESS_ACCESS_STATUS_OPTIONS.find((option) => option.value === status),
    [status],
  );
  const currentStatus = business?.accessStatus || business?.status || 'active';
  const isBlockingStatus = BLOCKING_STATUSES.has(status);
  const cleanReason = reason.trim();
  const confirmationMatches = confirmation.trim() === (business?.id || '');
  const reasonInvalid = cleanReason.length < 8;
  const confirmationInvalid = Boolean(confirmation) && !confirmationMatches;
  const canSubmit =
    Boolean(business?.id) &&
    !reasonInvalid &&
    confirmationMatches &&
    !isSubmitting;

  const resetDraft = useCallback(() => {
    setStatus(DEFAULT_STATUS);
    setReason('');
    setConfirmation('');
    setSubmitAttempted(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isSubmitting) return;
    resetDraft();
    onClose();
  }, [isSubmitting, onClose, resetDraft]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) handleClose();
    },
    [handleClose],
  );

  const handleStatusChange = useCallback((key: Key | null) => {
    if (!key) return;
    setStatus(String(key) as BusinessAccessStatus);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSubmitAttempted(true);

      if (!business?.id || reasonInvalid || !confirmationMatches) {
        return;
      }

      setIsSubmitting(true);
      try {
        const response = await fbUpdateBusinessAccess({
          businessId: business.id,
          status,
          reason: cleanReason,
        });
        message.success(
          `Acceso actualizado a ${
            getBusinessAccessStatusDisplay(response.status || status, {
              includeLegacyStatusLabels: false,
            }).label
          }.`,
        );
        onUpdated?.(response);
        resetDraft();
        onClose();
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'No se pudo actualizar el acceso del negocio.';
        message.error(errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      business?.id,
      cleanReason,
      confirmationMatches,
      onClose,
      onUpdated,
      reasonInvalid,
      resetDraft,
      status,
    ],
  );

  const footer = (
    <AdminBusinessActionFooter
      canSubmit={canSubmit}
      formId={FORM_ID}
      isSubmitting={isSubmitting}
      onCancel={handleClose}
      stackOnMobile
      submitLabel="Aplicar cambio"
      submitVariant={isBlockingStatus ? 'danger' : 'primary'}
    />
  );

  return (
    <VmModal
      isOpen={isOpen}
      onOpenChange={handleOpenChange}
      title="Acceso del negocio"
      ariaLabel="Acceso del negocio"
      size="md"
      footer={footer}
      isKeyboardDismissDisabled={isSubmitting}
    >
      <AdminBusinessModalContent>
        <AdminBusinessSummary
          businessId={business?.id}
          businessName={business?.name}
          statusTitle="Estado actual"
          statusLabel={
            getBusinessAccessStatusDisplay(currentStatus, {
              includeLegacyStatusLabels: false,
            }).label
          }
        />

        <AdminBusinessNotice status={isBlockingStatus ? 'warning' : 'accent'}>
          <AdminBusinessNoticeIcon>
            <ExclamationCircleOutlined />
          </AdminBusinessNoticeIcon>
          <VmAlert.Content>
            <VmAlert.Title>
              {isBlockingStatus
                ? 'Este cambio bloquea el acceso del negocio.'
                : 'Este cambio ajusta la politica de acceso del negocio.'}
            </VmAlert.Title>
            <AdminBusinessNoticeDescription>
              {isBlockingStatus
                ? 'Se desactivan membresias del negocio y se revocan sesiones activas.'
                : 'Los usuarios conservan acceso activo cuando la politica lo permite.'}
            </AdminBusinessNoticeDescription>
          </VmAlert.Content>
        </AdminBusinessNotice>

        <VmForm id={FORM_ID} onSubmit={handleSubmit}>
          <Fields>
            <AdminBusinessField>
              <AdminBusinessFieldLabel>Nuevo estado</AdminBusinessFieldLabel>
              <AccessSelect
                aria-label="Nuevo estado de acceso"
                selectedKey={status}
                onSelectionChange={handleStatusChange}
                isDisabled={isSubmitting}
                fullWidth
              >
                <VmSelect.Trigger>
                  <VmSelect.Value />
                  <VmSelect.Indicator />
                </VmSelect.Trigger>
                <VmSelect.Popover>
                  <VmListBox aria-label="Estados de acceso del negocio">
                    {BUSINESS_ACCESS_STATUS_OPTIONS.map((option) => (
                      <VmListBox.Item
                        key={option.value}
                        id={option.value}
                        textValue={option.label}
                      >
                        {option.label}
                        <VmListBox.ItemIndicator />
                      </VmListBox.Item>
                    ))}
                  </VmListBox>
                </VmSelect.Popover>
              </AccessSelect>
              {selectedOption?.description ? (
                <HelpText>{selectedOption.description}</HelpText>
              ) : null}
            </AdminBusinessField>

            <AdminBusinessField>
              <AdminBusinessFieldLabel>Razon</AdminBusinessFieldLabel>
              <ReasonArea
                aria-label="Razon del cambio"
                value={reason}
                disabled={isSubmitting}
                placeholder="Ej. Solicitud de soporte, offboarding, mora o prueba operativa."
                onChange={(event) => setReason(event.target.value)}
              />
              {submitAttempted && reasonInvalid ? (
                <AdminBusinessErrorText>
                  La razon debe tener al menos 8 caracteres.
                </AdminBusinessErrorText>
              ) : null}
            </AdminBusinessField>

            <AdminBusinessConfirmationField
              businessId={business?.id}
              confirmationInvalid={confirmationInvalid}
              isSubmitting={isSubmitting}
              inputMonospace
              submitAttempted={submitAttempted}
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
            />
          </Fields>
        </VmForm>

        <AuditNote>
          La accion queda registrada en auditoria de plataforma.
        </AuditNote>
      </AdminBusinessModalContent>
    </VmModal>
  );
};

const Fields = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const AccessSelect = styled(VmSelect)`
  width: 100%;
`;

const ReasonArea = styled(VmTextArea)`
  min-height: 92px;
`;

const HelpText = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

const AuditNote = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;
