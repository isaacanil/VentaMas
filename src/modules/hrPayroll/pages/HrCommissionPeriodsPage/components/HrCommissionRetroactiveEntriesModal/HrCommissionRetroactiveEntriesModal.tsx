import { VmAlert, VmButton, VmModal } from '@/components/heroui';
import { CheckOutlined, RollbackOutlined } from '@/constants/icons/antd';
import {
  HR_COMMISSION_PERIOD_STATUS_LABELS as STATUS_LABELS,
  formatHrDateKey,
  formatHrMoney as formatMoney,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrCommissionRetroactiveEntriesResponse,
  HrCommissionRetroactiveEntryRecord,
} from '@/types/hrPayroll';
import { HrStatusTag as StatusTag } from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';

import {
  ModalActions,
  RetroactiveCellStack,
  RetroactiveEmpty,
  RetroactiveGuidance,
  RetroactiveMutedText,
  RetroactivePrimaryText,
  RetroactiveReasonText,
  RetroactiveStack,
  RetroactiveSummary,
  RetroactiveSummaryItem,
  RetroactiveSummaryLabel,
  RetroactiveSummaryValue,
  RetroactiveTable,
  RetroactiveTableWrap,
} from './HrCommissionRetroactiveEntriesModal.styles';

interface HrCommissionRetroactiveEntriesModalProps {
  actionKey: string | null;
  error?: Error | null;
  isOpen: boolean;
  loading?: boolean;
  onCancel: () => void;
  onResolve: (
    entry: HrCommissionRetroactiveEntryRecord,
  ) => void | Promise<void>;
  onUnresolve: (
    entry: HrCommissionRetroactiveEntryRecord,
  ) => void | Promise<void>;
  result: HrCommissionRetroactiveEntriesResponse | null;
}

const ACTION_LABELS: Record<
  HrCommissionRetroactiveEntryRecord['action'],
  string
> = {
  adjustment_required: 'Pendiente de ajuste',
  recalculable: 'Recalculable',
  selected_for_next_cut: 'En próximo corte',
  selected_for_other_cut: 'En otro corte',
  included_in_cut: 'Incluida',
  paid: 'Pagada',
  review_required: 'Revisar',
};

const getEntryName = (entry: HrCommissionRetroactiveEntryRecord): string =>
  entry.employeeNameSnapshot || entry.employeeCode || entry.employeeId || 'N/A';

const getEntryCode = (entry: HrCommissionRetroactiveEntryRecord): string =>
  entry.employeeCode || entry.employeeId || '-';

const getOriginName = (entry: HrCommissionRetroactiveEntryRecord): string => {
  if (entry.originalPeriodLabel) {
    return entry.originalPeriodLabel.replace(
      /\s+\d{4}-\d{2}-\d{2}\s+-\s+\d{4}-\d{2}-\d{2}$/,
      '',
    );
  }
  return entry.originalPeriodId || '-';
};

const getOriginRange = (
  entry: HrCommissionRetroactiveEntryRecord,
): string | null => {
  if (!entry.originalStartDateKey || !entry.originalEndDateKey) return null;
  return `${formatHrDateKey(entry.originalStartDateKey)} - ${formatHrDateKey(
    entry.originalEndDateKey,
  )}`;
};

const getStatusTone = (
  action: HrCommissionRetroactiveEntryRecord['action'],
) => {
  if (action === 'selected_for_next_cut') return 'success';
  if (action === 'adjustment_required') return 'warning';
  if (action === 'selected_for_other_cut' || action === 'review_required') {
    return 'danger';
  }
  if (action === 'recalculable') return 'info';
  return 'default';
};

export function HrCommissionRetroactiveEntriesModal({
  actionKey,
  error = null,
  isOpen,
  loading = false,
  onCancel,
  onResolve,
  onUnresolve,
  result,
}: HrCommissionRetroactiveEntriesModalProps) {
  const rows = result?.entries ?? [];

  return (
    <VmModal
      title="Revisar retroactivas"
      ariaLabel="Revisar comisiones retroactivas"
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
      size="full"
      footer={
        <ModalActions>
          <VmButton variant="secondary" onPress={onCancel}>
            Cerrar
          </VmButton>
        </ModalActions>
      }
    >
      <RetroactiveStack>
        {error ? (
          <VmAlert status="danger">
            <VmAlert.Content>
              <strong>No se pudieron cargar las retroactivas.</strong>
              <div>{error.message}</div>
            </VmAlert.Content>
          </VmAlert>
        ) : null}

        <RetroactiveGuidance>
          Revisa por qué cada comisión quedó fuera del corte original. Al
          incluirla, se sumará como ajuste al próximo corte seleccionado.
        </RetroactiveGuidance>

        <RetroactiveSummary>
          <RetroactiveSummaryItem>
            <RetroactiveSummaryLabel>Pendientes</RetroactiveSummaryLabel>
            <RetroactiveSummaryValue>
              {result?.adjustmentRequiredCount ?? '-'}
            </RetroactiveSummaryValue>
          </RetroactiveSummaryItem>
          <RetroactiveSummaryItem>
            <RetroactiveSummaryLabel>Seleccionadas</RetroactiveSummaryLabel>
            <RetroactiveSummaryValue>
              {result?.selectedForTargetCount ?? '-'}
            </RetroactiveSummaryValue>
          </RetroactiveSummaryItem>
          <RetroactiveSummaryItem>
            <RetroactiveSummaryLabel>Recalculables</RetroactiveSummaryLabel>
            <RetroactiveSummaryValue>
              {result?.recalculableCount ?? '-'}
            </RetroactiveSummaryValue>
          </RetroactiveSummaryItem>
          <RetroactiveSummaryItem>
            <RetroactiveSummaryLabel>
              Ajuste seleccionado
            </RetroactiveSummaryLabel>
            <RetroactiveSummaryValue>
              {result && result.retroactiveAdjustmentAmount > 0
                ? formatMoney(result.retroactiveAdjustmentAmount)
                : 'Sin seleccionar'}
            </RetroactiveSummaryValue>
          </RetroactiveSummaryItem>
        </RetroactiveSummary>

        {loading ? (
          <RetroactiveEmpty>Cargando retroactivas...</RetroactiveEmpty>
        ) : rows.length === 0 ? (
          <RetroactiveEmpty>No hay retroactivas por revisar.</RetroactiveEmpty>
        ) : (
          <RetroactiveTableWrap>
            <RetroactiveTable>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Colaborador</th>
                  <th>Detalle</th>
                  <th>Monto</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((entry) => {
                  const resolving = actionKey === `retro:resolve:${entry.id}`;
                  const unresolving =
                    actionKey === `retro:unresolve:${entry.id}`;
                  const originRange = getOriginRange(entry);
                  return (
                    <tr key={entry.id}>
                      <td>{formatHrDateKey(entry.dateKey)}</td>
                      <td>
                        <RetroactiveCellStack>
                          <RetroactivePrimaryText>
                            {getEntryName(entry)}
                          </RetroactivePrimaryText>
                          <RetroactiveMutedText>
                            {getEntryCode(entry)}
                          </RetroactiveMutedText>
                          <RetroactiveMutedText>
                            Factura:{' '}
                            {entry.invoiceNumber || entry.invoiceId || '-'}
                          </RetroactiveMutedText>
                        </RetroactiveCellStack>
                      </td>
                      <td>
                        <RetroactiveCellStack>
                          <RetroactivePrimaryText>
                            {entry.serviceName || entry.serviceId || '-'}
                          </RetroactivePrimaryText>
                          <RetroactiveMutedText>
                            Corte original: {getOriginName(entry)}
                          </RetroactiveMutedText>
                          {originRange ? (
                            <RetroactiveMutedText>
                              Rango original: {originRange}
                            </RetroactiveMutedText>
                          ) : null}
                          <RetroactiveMutedText>
                            Estado:{' '}
                            {STATUS_LABELS[entry.originalPeriodStatus]}
                          </RetroactiveMutedText>
                          <RetroactiveReasonText>
                            Motivo: comisión detectada después de generar o
                            aprobar el corte original; queda pendiente de
                            incluir en un próximo corte.
                          </RetroactiveReasonText>
                        </RetroactiveCellStack>
                      </td>
                      <td>
                        {formatMoney(entry.commissionAmount, entry.currency)}
                      </td>
                      <td>
                        {entry.action === 'adjustment_required' ? (
                          <VmButton
                            size="sm"
                            variant="primary"
                            isDisabled={Boolean(actionKey)}
                            onPress={() => onResolve(entry)}
                          >
                            <CheckOutlined />
                            {resolving ? 'Incluyendo...' : 'Incluir'}
                          </VmButton>
                        ) : entry.action === 'selected_for_next_cut' ? (
                          <VmButton
                            size="sm"
                            variant="secondary"
                            isDisabled={Boolean(actionKey)}
                            onPress={() => onUnresolve(entry)}
                          >
                            <RollbackOutlined />
                            {unresolving ? 'Quitando...' : 'Quitar'}
                          </VmButton>
                        ) : (
                          <StatusTag $tone={getStatusTone(entry.action)}>
                            {ACTION_LABELS[entry.action]}
                          </StatusTag>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </RetroactiveTable>
          </RetroactiveTableWrap>
        )}
      </RetroactiveStack>
    </VmModal>
  );
}

export default HrCommissionRetroactiveEntriesModal;
