import { VmTabs } from '@/components/heroui';
import {
  HrDataTable,
  type HrTableColumn,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import type {
  HrCommissionPeriodRecord,
  HrEmployeePaymentRecord,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';
import { paymentColumns } from '../HrCommissionPeriodsPage.columns';
import {
  DetailDescription,
  DetailEmptyState,
  DetailEmptyText,
  DetailEmptyTitle,
  DetailHeader,
  DetailHeadingStack,
  DetailPanelContent,
  DetailSection,
  DetailTabs,
  DetailTitle,
} from '../HrCommissionPeriodsPage.styles';
import { PeriodActionButtons } from './PeriodActionButtons';

type PeriodAction = 'close' | 'approve';

interface HrCommissionPeriodDetailPanelProps {
  actionKey: string | null;
  employeeLines: HrPayrollEmployeeLineRecord[];
  lineColumns: HrTableColumn<HrPayrollEmployeeLineRecord>[];
  linesLoading: boolean;
  payments: HrEmployeePaymentRecord[];
  paymentsLoading: boolean;
  period: HrCommissionPeriodRecord | null;
  periodDescription: string | null;
  periodLabel: string;
  onAction: (action: PeriodAction, period: HrCommissionPeriodRecord) => void;
}

export function HrCommissionPeriodDetailPanel({
  actionKey,
  employeeLines,
  lineColumns,
  linesLoading,
  onAction,
  payments,
  paymentsLoading,
  period,
  periodDescription,
  periodLabel,
}: HrCommissionPeriodDetailPanelProps) {
  return (
    <DetailSection>
      <DetailHeader>
        <DetailHeadingStack>
          <DetailTitle>Detalle del corte seleccionado</DetailTitle>
          {periodDescription ? (
            <DetailDescription>{periodDescription}</DetailDescription>
          ) : null}
        </DetailHeadingStack>
        {period ? (
          <PeriodActionButtons
            actionKey={actionKey}
            layout="toolbar"
            period={period}
            onAction={onAction}
          />
        ) : null}
      </DetailHeader>

      {period ? (
        <DetailTabs defaultSelectedKey="collaborators">
          <VmTabs.ListContainer>
            <VmTabs.List aria-label={`Detalle de ${periodLabel}`}>
              <VmTabs.Tab id="collaborators">
                <VmTabs.Indicator />
                Colaboradores ({employeeLines.length})
              </VmTabs.Tab>
              <VmTabs.Tab id="payments">
                <VmTabs.Indicator />
                Pagos ({payments.length})
              </VmTabs.Tab>
            </VmTabs.List>
          </VmTabs.ListContainer>

          <VmTabs.Panel id="collaborators">
            <DetailPanelContent>
              <HrDataTable<HrPayrollEmployeeLineRecord>
                ariaLabel="Lineas por colaborador"
                columns={lineColumns}
                rows={employeeLines}
                loading={linesLoading}
                emptyText="Sin lineas para este corte"
                minTableWidth={720}
                pageSize={8}
              />
            </DetailPanelContent>
          </VmTabs.Panel>

          <VmTabs.Panel id="payments">
            <DetailPanelContent>
              <HrDataTable<HrEmployeePaymentRecord>
                ariaLabel="Pagos registrados"
                columns={paymentColumns}
                rows={payments}
                loading={paymentsLoading}
                emptyText="Sin pagos para este corte"
                minTableWidth={560}
                pageSize={5}
              />
            </DetailPanelContent>
          </VmTabs.Panel>
        </DetailTabs>
      ) : (
        <DetailEmptyState>
          <DetailEmptyTitle>Sin corte seleccionado</DetailEmptyTitle>
          <DetailEmptyText>
            Vuelve a cortes y abre un periodo disponible.
          </DetailEmptyText>
        </DetailEmptyState>
      )}
    </DetailSection>
  );
}
