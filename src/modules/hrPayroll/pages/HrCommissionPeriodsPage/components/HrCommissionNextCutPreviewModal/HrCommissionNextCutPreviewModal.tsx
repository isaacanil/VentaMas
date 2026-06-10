import { VmAlert, VmButton, VmModal } from '@/components/heroui';
import { SyncOutlined } from '@/constants/icons/antd';
import {
  HR_COMMISSION_CUT_RULE_FREQUENCY_LABELS as FREQUENCY_LABELS,
  formatHrDateKey,
  formatHrMoney as formatMoney,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrCommissionNextCutPreview } from '@/types/hrPayroll';

import {
  ModalActions,
  PreviewGrid,
  PreviewItem,
  PreviewLabel,
  PreviewMessage,
  PreviewStack,
  PreviewValue,
} from './HrCommissionNextCutPreviewModal.styles';

interface HrCommissionNextCutPreviewModalProps {
  actionKey: string | null;
  error?: Error | null;
  isOpen: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  onReviewRetroactives?: () => void;
  preview: HrCommissionNextCutPreview | null;
}

const getPreviewBlockedMessage = (
  preview: HrCommissionNextCutPreview | null,
): string | null => {
  if (!preview) return null;
  if (preview.hasRetroactiveEntries) {
    const count = preview.retroactiveEntriesCount ?? 0;
    const amount = preview.retroactiveAdjustmentAmount ?? 0;
    const retroactiveText =
      count > 0
        ? `${count} retroactiva${count === 1 ? '' : 's'} pendiente${
            count === 1 ? '' : 's'
          }`
        : 'las retroactivas pendientes';
    const amountText =
      amount > 0
        ? ` Impacto pendiente: ${formatMoney(amount, preview.currency)}.`
        : '';
    return `No puedes crear este corte hasta resolver ${retroactiveText}.${amountText}`;
  }
  if (preview.exceedsMaxCutEntries) {
    return `El corte supera el máximo de ${preview.maxCutEntries} entradas elegibles. Divide o depura las entradas antes de crear el corte.`;
  }
  return preview.blockedReason ?? null;
};

export function HrCommissionNextCutPreviewModal({
  actionKey,
  error = null,
  isOpen,
  loading = false,
  onCancel,
  onConfirm,
  onReviewRetroactives,
  preview,
}: HrCommissionNextCutPreviewModalProps) {
  const creating = actionKey === 'create';
  const blockedMessage = getPreviewBlockedMessage(preview);
  const canCreate = Boolean(preview?.canCreate) && !loading && !error;
  const canReviewRetroactives = Boolean(
    onReviewRetroactives && (preview?.retroactiveEntriesCount ?? 0) > 0,
  );
  const isBlocked = Boolean(blockedMessage);
  const modalTitle = isBlocked ? 'Revisar próximo corte' : 'Crear próximo corte';
  const rangeLabel = preview
    ? `${formatHrDateKey(preview.startDateKey)} - ${formatHrDateKey(
        preview.endDateKey,
      )}`
    : 'Calculando...';

  return (
    <VmModal
      title={modalTitle}
      ariaLabel={modalTitle}
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size="lg"
      footer={
        <ModalActions>
          <VmButton
            variant="secondary"
            isDisabled={creating}
            onPress={onCancel}
          >
            Cancelar
          </VmButton>
          {isBlocked && canReviewRetroactives ? (
            <VmButton
              variant="primary"
              isDisabled={creating}
              onPress={onReviewRetroactives}
            >
              Revisar retroactivas
            </VmButton>
          ) : null}
          {!isBlocked ? (
            <VmButton
              variant="primary"
              isDisabled={!canCreate || creating}
              onPress={onConfirm}
            >
              <SyncOutlined />
              {creating ? 'Creando...' : 'Crear corte'}
            </VmButton>
          ) : null}
        </ModalActions>
      }
    >
      <PreviewStack>
        {loading ? (
          <PreviewMessage>Calculando el próximo corte...</PreviewMessage>
        ) : null}

        {error ? (
          <VmAlert status="danger">
            <VmAlert.Content>
              <strong>No se pudo calcular el próximo corte.</strong>
              <div>{error.message}</div>
            </VmAlert.Content>
          </VmAlert>
        ) : null}

        {blockedMessage ? (
          <VmAlert status="warning">
            <VmAlert.Content>
              <strong>No se puede crear este corte todavía.</strong>
              <div>{blockedMessage}</div>
            </VmAlert.Content>
          </VmAlert>
        ) : null}

        {!loading || preview ? (
        <PreviewGrid>
          <PreviewItem>
            <PreviewLabel>Rango</PreviewLabel>
            <PreviewValue>{rangeLabel}</PreviewValue>
          </PreviewItem>
          <PreviewItem>
            <PreviewLabel>Regla activa</PreviewLabel>
            <PreviewValue>
              {preview?.ruleLabel ?? 'Sin regla activa'}
              {preview ? ` - ${FREQUENCY_LABELS[preview.frequency]}` : null}
            </PreviewValue>
          </PreviewItem>
          {isBlocked ? (
            <>
              <PreviewItem>
                <PreviewLabel>Retroactivas pendientes</PreviewLabel>
                <PreviewValue>
                  {preview?.retroactiveEntriesCount ?? '-'}
                </PreviewValue>
              </PreviewItem>
              {(preview?.retroactiveAdjustmentAmount ?? 0) > 0 ? (
                <PreviewItem>
                  <PreviewLabel>Monto retroactivo</PreviewLabel>
                  <PreviewValue>
                    {formatMoney(
                      preview?.retroactiveAdjustmentAmount ?? 0,
                      preview?.currency,
                    )}
                  </PreviewValue>
                </PreviewItem>
              ) : null}
            </>
          ) : (
            <>
              <PreviewItem>
                <PreviewLabel>Colaboradores incluidos</PreviewLabel>
                <PreviewValue>{preview?.employeesCount ?? '-'}</PreviewValue>
              </PreviewItem>
              <PreviewItem>
                <PreviewLabel>Comisiones incluidas</PreviewLabel>
                <PreviewValue>{preview?.entriesCount ?? '-'}</PreviewValue>
              </PreviewItem>
              <PreviewItem>
                <PreviewLabel>Total estimado</PreviewLabel>
                <PreviewValue>
                  {preview
                    ? formatMoney(
                        preview.totalEstimatedAmount,
                        preview.currency,
                      )
                    : '-'}
                </PreviewValue>
              </PreviewItem>
            </>
          )}
          <PreviewItem>
            <PreviewLabel>Zona de negocio</PreviewLabel>
            <PreviewValue>
              {preview?.businessTimeZone ?? 'America/Santo_Domingo'}
            </PreviewValue>
          </PreviewItem>
        </PreviewGrid>
        ) : null}
      </PreviewStack>
    </VmModal>
  );
}

export default HrCommissionNextCutPreviewModal;
