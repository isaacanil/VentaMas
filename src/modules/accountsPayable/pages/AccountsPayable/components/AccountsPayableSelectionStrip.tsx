import { Button } from 'antd';
import styled from 'styled-components';

import {
  CalculatorOutlined,
  ClearOutlined,
  FileExcelOutlined,
} from '@/constants/icons/antd';
import { formatPrice } from '@/utils/format/formatPrice';

import type { AccountsPayablePaymentProposal } from '../utils/accountsPayablePaymentProposal';

interface AccountsPayableSelectionStripProps {
  hasError?: boolean;
  isExporting?: boolean;
  isLoading?: boolean;
  onClearSelection: () => void;
  onExportSelection: () => void | Promise<void>;
  onOpenPaymentProposal: () => void;
  paymentProposal: AccountsPayablePaymentProposal;
  paymentProposalBlockedReason?: string | null;
  selectedRowsCount: number;
  visibleRowsCount: number;
}

export const AccountsPayableSelectionStrip = ({
  hasError = false,
  isExporting = false,
  isLoading = false,
  onClearSelection,
  onExportSelection,
  onOpenPaymentProposal,
  paymentProposal,
  paymentProposalBlockedReason,
  selectedRowsCount,
  visibleRowsCount,
}: AccountsPayableSelectionStripProps) => {
  const selectedRowsLabel = `${selectedRowsCount} seleccionada${
    selectedRowsCount === 1 ? '' : 's'
  }`;
  const financialStateLabel = isLoading
    ? 'Actualizando'
    : hasError
      ? 'Sin confirmar'
      : null;
  const renderMetricAmount = (value: number) =>
    financialStateLabel ?? formatPrice(value);
  const proposalDisabled =
    isLoading ||
    hasError ||
    selectedRowsCount === 0 ||
    Boolean(paymentProposalBlockedReason);
  const exportDisabled =
    isLoading || hasError || isExporting || selectedRowsCount === 0;

  return (
    <SelectionStrip aria-label="Resumen de seleccion CxP">
      <SelectionContent>
        <SelectionHeadline>
          <strong>{selectedRowsLabel}</strong>
          <span>de {visibleRowsCount} visibles</span>
        </SelectionHeadline>

        <MetricGrid>
          <MetricItem>
            <span>Caja estimada</span>
            <strong>
              {renderMetricAmount(paymentProposal.eligibleCashRequirementAmount)}
            </strong>
          </MetricItem>
          <MetricItem>
            <span>Balance aprobado</span>
            <strong>{renderMetricAmount(paymentProposal.eligibleAmount)}</strong>
          </MetricItem>
          {paymentProposal.eligibleWithholdingAmount > 0 ? (
            <MetricItem>
              <span>Retenciones</span>
              <strong>
                {renderMetricAmount(paymentProposal.eligibleWithholdingAmount)}
              </strong>
            </MetricItem>
          ) : null}
          {paymentProposal.blockedCount > 0 ? (
            <MetricItem $tone="warning">
              <span>Excluidas por control</span>
              <strong>
                {paymentProposal.blockedCount} ·{' '}
                {renderMetricAmount(paymentProposal.blockedAmount)}
              </strong>
            </MetricItem>
          ) : null}
        </MetricGrid>
      </SelectionContent>

      <ActionGroup>
        <Button
          aria-label="Limpiar seleccion CxP"
          icon={<ClearOutlined />}
          onClick={onClearSelection}
        >
          Limpiar
        </Button>
        <Button
          aria-label="Abrir propuesta de pago para la seleccion CxP"
          disabled={proposalDisabled}
          icon={<CalculatorOutlined />}
          onClick={onOpenPaymentProposal}
        >
          Propuesta
        </Button>
        <Button
          aria-label="Exportar seleccion de cuentas por pagar"
          disabled={exportDisabled}
          icon={<FileExcelOutlined />}
          loading={isExporting}
          onClick={() => {
            void onExportSelection();
          }}
        >
          Exportar
        </Button>
      </ActionGroup>
    </SelectionStrip>
  );
};

const SelectionStrip = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid var(--ds-color-border-default, #d9d9d9);
  border-radius: 8px;
  background: var(--ds-color-bg-surface, #fff);

  @media (width <= 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

const SelectionContent = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const SelectionHeadline = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
  align-items: baseline;
  min-width: 0;
  color: var(--ds-color-text-secondary, #666);
  font-size: 13px;

  strong {
    color: var(--ds-color-text-primary, #111);
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  span {
    min-width: 0;
    overflow-wrap: anywhere;
  }
`;

const MetricGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 128px), 1fr));
  gap: 8px;
  min-width: 0;
`;

const MetricItem = styled.div<{ $tone?: 'warning' }>`
  display: grid;
  gap: 2px;
  min-width: 0;
  padding: 8px 10px;
  border: 1px solid
    ${({ $tone }) =>
      $tone === 'warning'
        ? 'rgb(173 104 0 / 24%)'
        : 'var(--ds-color-border-subtle, #edf0f3)'};
  border-radius: 6px;
  background: ${({ $tone }) =>
    $tone === 'warning' ? 'rgb(250 173 20 / 8%)' : '#f8fafc'};

  span {
    color: var(--ds-color-text-secondary, #666);
    font-size: 11px;
    line-height: 1.25;
    text-transform: uppercase;
    letter-spacing: 0;
  }

  strong {
    min-width: 0;
    color: var(--ds-color-text-primary, #111);
    font-size: 13px;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }
`;

const ActionGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  min-width: 0;

  @media (width <= 760px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
    width: 100%;

    .ant-btn {
      width: 100%;
    }
  }
`;
