import { Alert, Button, Input, Typography, message } from 'antd';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { ModalShell } from '@/components/common/Modal';
import { selectUser } from '@/features/auth/userSlice';
import {
  fbManageVendorBillControl,
  type ManageVendorBillControlAction,
} from '@/firebase/purchase/fbManageVendorBillControl';
import type { UserIdentity } from '@/types/users';

import {
  getAccountsPayableControlActionDefinition,
  isAccountsPayableControlActionEvidenceRequired,
} from '../utils/accountsPayableControlActions';
import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';

const { Text } = Typography;
const { TextArea } = Input;

const normalizeEvidenceUrls = (value: string): string[] =>
  value
    .split(/[\s,;]+/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .slice(0, 10);

interface AccountsPayableControlActionModalProps {
  action: ManageVendorBillControlAction | null;
  onCancel: () => void;
  onCompleted: () => void;
  open: boolean;
  row: AccountsPayableRow | null;
}

const resolveCallableErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string => {
  const typedError =
    error && typeof error === 'object'
      ? (error as { code?: string; message?: string })
      : null;
  const code = String(typedError?.code || '').toLowerCase();
  const rawMessage = String(typedError?.message || '')
    .replace(/^functions\/[a-z-]+:\s*/i, '')
    .trim();

  if (code.includes('permission-denied')) {
    return 'No tienes permisos para completar esta acción.';
  }
  if (code.includes('unauthenticated')) {
    return 'Tu sesión expiró. Inicia sesión nuevamente.';
  }

  return rawMessage || fallbackMessage;
};

export const AccountsPayableControlActionModal = ({
  action,
  onCancel,
  onCompleted,
  open,
  row,
}: AccountsPayableControlActionModalProps) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const [reason, setReason] = useState('');
  const [evidenceNote, setEvidenceNote] = useState('');
  const [evidenceUrlsText, setEvidenceUrlsText] = useState('');
  const [reasonTouched, setReasonTouched] = useState(false);
  const [evidenceTouched, setEvidenceTouched] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const definition = action
    ? getAccountsPayableControlActionDefinition(action)
    : null;
  const normalizedReason = reason.trim();
  const normalizedEvidenceNote = evidenceNote.trim();
  const normalizedEvidenceUrls = normalizeEvidenceUrls(evidenceUrlsText);
  const hasEvidence =
    normalizedEvidenceNote.length >= 3 || normalizedEvidenceUrls.length > 0;
  const requiresEvidence = action
    ? isAccountsPayableControlActionEvidenceRequired(action)
    : false;
  const reasonError =
    reasonTouched && normalizedReason.length < 5
      ? 'Indica un motivo de al menos 5 caracteres.'
      : null;
  const evidenceError =
    requiresEvidence && evidenceTouched && !hasEvidence
      ? 'Indica una evidencia o referencia para esta acción.'
      : null;

  const resetForm = () => {
    setReason('');
    setEvidenceNote('');
    setEvidenceUrlsText('');
    setReasonTouched(false);
    setEvidenceTouched(false);
    setBackendError(null);
  };

  const handleCancel = () => {
    if (submitting) return;
    resetForm();
    onCancel();
  };

  const handleConfirm = async () => {
    if (!row || !action || !definition) return;

    setReasonTouched(true);
    setEvidenceTouched(true);
    if (normalizedReason.length < 5) {
      setBackendError(null);
      message.error('Debe indicar un motivo para el control de CxP.');
      return;
    }
    if (requiresEvidence && !hasEvidence) {
      setBackendError(null);
      message.error('Debe indicar una evidencia o referencia.');
      return;
    }

    setBackendError(null);
    setSubmitting(true);
    try {
      await fbManageVendorBillControl(user, {
        action,
        evidenceNote: normalizedEvidenceNote || null,
        evidenceUrls: normalizedEvidenceUrls,
        purchaseId: row.purchase.id,
        reason: normalizedReason,
        vendorBillId: row.vendorBill.id,
      });
      message.success(`${definition.label} aplicado correctamente.`);
      resetForm();
      onCompleted();
    } catch (error) {
      console.error('Failed to manage vendor bill control', error);
      const errorMessage = resolveCallableErrorMessage(
        error,
        'No se pudo actualizar el control de CxP.',
      );
      setBackendError(errorMessage);
      message.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      destroyOnHidden
      footer={[
        <Button key="cancel" disabled={submitting} onClick={handleCancel}>
          Cancelar
        </Button>,
        <Button
          key="confirm"
          danger={definition?.tone === 'danger'}
          loading={submitting}
          onClick={handleConfirm}
          type="primary"
        >
          {definition?.confirmLabel ?? 'Aplicar'}
        </Button>,
      ]}
      onCancel={handleCancel}
      open={open}
      title={definition?.title ?? 'Control de CxP'}
      width={520}
    >
      <FormLayout>
        <Intro>
          <Text>
            {definition?.description ??
              'Se actualizará el control de esta cuenta por pagar.'}
          </Text>
          {row ? (
            <ReferenceLine>
              <strong>{row.providerName}</strong>
              <span>Compra {row.reference}</span>
            </ReferenceLine>
          ) : null}
        </Intro>

        {backendError ? (
          <Alert
            description={backendError}
            message="No se pudo completar la acción"
            showIcon
            type="warning"
          />
        ) : null}

        <Field>
          <Label htmlFor="cxp-control-reason">
            {definition?.reasonLabel ?? 'Motivo'}
          </Label>
          <TextArea
            aria-describedby={
              reasonError ? 'cxp-control-reason-error' : undefined
            }
            aria-invalid={reasonError ? 'true' : 'false'}
            autoSize={{ minRows: 3, maxRows: 5 }}
            disabled={submitting}
            id="cxp-control-reason"
            maxLength={240}
            onBlur={() => setReasonTouched(true)}
            onChange={(event) => {
              const nextReason = event.target.value;
              setReason(nextReason);
              setBackendError(null);
              if (reasonTouched && nextReason.trim().length >= 5) {
                setReasonTouched(false);
              }
            }}
            placeholder={definition?.reasonPlaceholder}
            showCount
            status={reasonError ? 'error' : undefined}
            value={reason}
          />
          {reasonError ? (
            <FieldError id="cxp-control-reason-error" role="alert">
              {reasonError}
            </FieldError>
          ) : null}
        </Field>

        <Field>
          <Label htmlFor="cxp-control-evidence">
            {definition?.evidenceLabel ?? 'Evidencia o referencia'}
            {requiresEvidence ? <RequiredMark> requerida</RequiredMark> : null}
          </Label>
          <Input
            aria-describedby={
              evidenceError ? 'cxp-control-evidence-error' : undefined
            }
            aria-invalid={evidenceError ? 'true' : 'false'}
            disabled={submitting}
            id="cxp-control-evidence"
            maxLength={180}
            onBlur={() => setEvidenceTouched(true)}
            onChange={(event) => {
              const nextEvidence = event.target.value;
              setEvidenceNote(nextEvidence);
              setBackendError(null);
              if (evidenceTouched && nextEvidence.trim().length >= 3) {
                setEvidenceTouched(false);
              }
            }}
            placeholder={definition?.evidencePlaceholder}
            status={evidenceError ? 'error' : undefined}
            value={evidenceNote}
          />
          {evidenceError ? (
            <FieldError id="cxp-control-evidence-error" role="alert">
              {evidenceError}
            </FieldError>
          ) : null}
        </Field>

        <Field>
          <Label htmlFor="cxp-control-evidence-urls">
            URLs de evidencia
          </Label>
          <TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            disabled={submitting}
            id="cxp-control-evidence-urls"
            maxLength={600}
            onChange={(event) => {
              setEvidenceUrlsText(event.target.value);
              setBackendError(null);
              if (
                evidenceTouched &&
                normalizeEvidenceUrls(event.target.value).length > 0
              ) {
                setEvidenceTouched(false);
              }
            }}
            placeholder="Pega enlaces a factura, recepción, nota de crédito o soporte interno"
            value={evidenceUrlsText}
          />
          <HelpText>
            Puedes pegar hasta 10 enlaces separados por línea, coma o espacio.
          </HelpText>
        </Field>
      </FormLayout>
    </ModalShell>
  );
};

const FormLayout = styled.div`
  display: grid;
  gap: 16px;
`;

const Intro = styled.div`
  display: grid;
  gap: 10px;
`;

const ReferenceLine = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  color: var(--ds-color-text-secondary, #666);
  font-size: 13px;

  strong {
    color: var(--ds-color-text-primary, #111);
  }
`;

const Field = styled.div`
  display: grid;
  gap: 8px;
`;

const Label = styled.label`
  color: var(--ds-color-text-primary, #111);
  font-weight: 600;
`;

const RequiredMark = styled.span`
  color: #cf1322;
  font-size: 12px;
  font-weight: 500;
`;

const FieldError = styled.div`
  color: #cf1322;
  font-size: 12px;
`;

const HelpText = styled.div`
  color: var(--ds-color-text-secondary, #667085);
  font-size: 12px;
`;
