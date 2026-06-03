import type { FormEvent, Key } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { message } from 'antd';
import styled from 'styled-components';

import {
  VmAlert,
  VmButton,
  VmForm,
  VmInput,
  VmLabel,
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

const getStatusLabel = (status?: string | null) => {
  const match = BUSINESS_ACCESS_STATUS_OPTIONS.find(
    (option) => option.value === status,
  );
  return match?.label || status || 'Activo';
};

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
          `Acceso actualizado a ${getStatusLabel(response.status || status)}.`,
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
        variant={isBlockingStatus ? 'danger' : 'primary'}
        isDisabled={!canSubmit}
        isPending={isSubmitting}
      >
        Aplicar cambio
      </VmButton>
    </Actions>
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
            <SummaryLabel>Estado actual</SummaryLabel>
            <SummaryValue>{getStatusLabel(currentStatus)}</SummaryValue>
          </SummaryItem>
        </SummaryGrid>

        <Notice status={isBlockingStatus ? 'warning' : 'accent'}>
          <NoticeIcon>
            <ExclamationCircleOutlined />
          </NoticeIcon>
          <VmAlert.Content>
            <VmAlert.Title>
              {isBlockingStatus
                ? 'Este cambio bloquea el acceso del negocio.'
                : 'Este cambio ajusta la politica de acceso del negocio.'}
            </VmAlert.Title>
            <NoticeDescription>
              {isBlockingStatus
                ? 'Se desactivan membresias del negocio y se revocan sesiones activas.'
                : 'Los usuarios conservan acceso activo cuando la politica lo permite.'}
            </NoticeDescription>
          </VmAlert.Content>
        </Notice>

        <VmForm id={FORM_ID} onSubmit={handleSubmit}>
          <Fields>
            <Field>
              <FieldLabel>Nuevo estado</FieldLabel>
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
            </Field>

            <Field>
              <FieldLabel>Razon</FieldLabel>
              <ReasonArea
                aria-label="Razon del cambio"
                value={reason}
                disabled={isSubmitting}
                placeholder="Ej. Solicitud de soporte, offboarding, mora o prueba operativa."
                onChange={(event) => setReason(event.target.value)}
              />
              {submitAttempted && reasonInvalid ? (
                <ErrorText>
                  La razon debe tener al menos 8 caracteres.
                </ErrorText>
              ) : null}
            </Field>

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
            </Field>
          </Fields>
        </VmForm>

        <AuditNote>
          La accion queda registrada en auditoria de plataforma.
        </AuditNote>
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

const NoticeIcon = styled(VmAlert.Indicator)`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding-top: 2px;
`;

const NoticeDescription = styled(VmAlert.Description)`
  margin: var(--ds-space-1) 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const Fields = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const Field = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const FieldLabel = styled(VmLabel)`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
`;

const AccessSelect = styled(VmSelect)`
  width: 100%;
`;

const ReasonArea = styled(VmTextArea)`
  min-height: 92px;
`;

const ConfirmInput = styled(VmInput)`
  width: 100%;
  font-family: var(--ds-font-family-mono);
`;

const HelpText = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

const ErrorText = styled.p`
  margin: 0;
  color: var(--ds-color-state-danger);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const AuditNote = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  justify-content: flex-end;

  @media (max-width: 520px) {
    width: 100%;

    > button {
      flex: 1 1 100%;
    }
  }
`;
