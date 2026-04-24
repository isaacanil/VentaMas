import { Alert } from 'antd';
import styled from 'styled-components';

import type {
  BankReconciliationRecord,
  InternalTransfer,
} from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { formatDate, formatMoney } from '../utils/formatters';

interface AccountInspectorRailProps {
  account: TreasuryLiquidityAccount;
  currentBalance: number;
  latestReconciliation: BankReconciliationRecord | null;
  pendingStatementLineCount: number;
  statementLineCount: number;
  transfers: InternalTransfer[];
  writtenOffStatementLineCount: number;
}

export const AccountInspectorRail = ({
  account,
  currentBalance,
  latestReconciliation,
  pendingStatementLineCount,
  statementLineCount,
  transfers,
  writtenOffStatementLineCount,
}: AccountInspectorRailProps) => (
  <Rail>
    <Panel>
      <PanelHeader>
        <div>
          <PanelTitle>Control</PanelTitle>
          <PanelCopy>
            Estado actual de la cuenta y consistencia contra su operación.
          </PanelCopy>
        </div>
      </PanelHeader>

      {account.status === 'inactive' ? (
        <Alert
          type="warning"
          showIcon
          message="Cuenta inactiva"
          description="Revísala antes de registrar nuevas operaciones."
        />
      ) : null}

      {account.kind === 'bank' && pendingStatementLineCount > 0 ? (
        <Alert
          type="warning"
          showIcon
          message="Excepciones de extracto pendientes"
          description={`${pendingStatementLineCount} línea(s) de extracto siguen sin match exacto.`}
        />
      ) : null}

      {account.kind === 'bank' && writtenOffStatementLineCount > 0 ? (
        <Alert
          type="info"
          showIcon
          message="Diferencias ajustadas"
          description={`${writtenOffStatementLineCount} línea(s) se cerraron con write-off explícito.`}
        />
      ) : null}

      {currentBalance < 0 ? (
        <Alert
          type="error"
          showIcon
          message="Saldo negativo detectado"
          description={`Balance actual ${formatMoney(currentBalance, account.currency)}. Revisa transferencias, gastos o cobros pendientes antes de seguir operando.`}
        />
      ) : null}

      {latestReconciliation?.status === 'variance' ? (
        <Alert
          type="warning"
          showIcon
          message="Conciliación con diferencia"
          description={`Última diferencia registrada: ${formatMoney(latestReconciliation.variance, account.currency)}.`}
        />
      ) : null}

      {account.kind === 'bank' &&
      latestReconciliation &&
      (latestReconciliation.unreconciledMovementCount ?? 0) > 0 ? (
        <Alert
          type="info"
          showIcon
          message="Movimientos pendientes de conciliación"
          description={`${latestReconciliation.unreconciledMovementCount} movimiento(s) bancarios quedaron fuera del último corte.`}
        />
      ) : null}

      {account.kind === 'bank' ? (
        latestReconciliation ? (
          <ControlStack>
            <ControlLine>
              <Label>Última conciliación</Label>
              <Value>{formatDate(latestReconciliation.statementDate)}</Value>
            </ControlLine>
            <ControlLine>
              <Label>Balance banco</Label>
              <Value>
                {formatMoney(
                  latestReconciliation.statementBalance,
                  account.currency,
                )}
              </Value>
            </ControlLine>
            <ControlLine>
              <Label>Balance ledger</Label>
              <Value>
                {formatMoney(latestReconciliation.ledgerBalance, account.currency)}
              </Value>
            </ControlLine>
            <ControlLine>
              <Label>Variación</Label>
              <VarianceValue
                $warning={latestReconciliation.status === 'variance'}
              >
                {formatMoney(latestReconciliation.variance, account.currency)}
              </VarianceValue>
            </ControlLine>
          </ControlStack>
        ) : (
          <Alert
            type="info"
            showIcon
            message="Sin conciliación registrada"
            description="Conviene registrar un estado de cuenta para validar diferencia contra ledger."
          />
        )
      ) : (
        <Alert
          type="info"
          showIcon
          message="Cuenta de caja"
          description="La conciliación bancaria no aplica. Usa transferencias y movimientos para control."
        />
      )}
    </Panel>

    <Panel>
      <PanelTitle>Contexto</PanelTitle>
      <ControlStack>
        <ControlLine>
          <Label>Tipo</Label>
          <Value>{account.kind === 'bank' ? 'Banco' : 'Caja'}</Value>
        </ControlLine>
        <ControlLine>
          <Label>Moneda</Label>
          <Value>{account.currency}</Value>
        </ControlLine>
        <ControlLine>
          <Label>Apertura</Label>
          <Value>{formatMoney(account.openingBalance, account.currency)}</Value>
        </ControlLine>
        <ControlLine>
          <Label>Balance actual</Label>
          <VarianceValue $warning={currentBalance < 0}>
            {formatMoney(currentBalance, account.currency)}
          </VarianceValue>
        </ControlLine>
        <ControlLine>
          <Label>Ubicación</Label>
          <Value>
            {account.kind === 'bank'
              ? account.institutionName || 'Cuenta bancaria'
              : account.location || 'Cuenta de caja'}
          </Value>
        </ControlLine>
        <ControlLine>
          <Label>Transferencias visibles</Label>
          <Value>{transfers.length}</Value>
        </ControlLine>
        {account.kind === 'bank' ? (
          <>
            <ControlLine>
              <Label>Líneas extracto</Label>
              <Value>{statementLineCount}</Value>
            </ControlLine>
            <ControlLine>
              <Label>Mov. conciliados</Label>
              <Value>{latestReconciliation?.reconciledMovementCount ?? 0}</Value>
            </ControlLine>
            <ControlLine>
              <Label>Mov. pendientes</Label>
              <VarianceValue
                $warning={(latestReconciliation?.unreconciledMovementCount ?? 0) > 0}
              >
                {latestReconciliation?.unreconciledMovementCount ?? 0}
              </VarianceValue>
            </ControlLine>
            <ControlLine>
              <Label>Excepciones</Label>
              <VarianceValue $warning={pendingStatementLineCount > 0}>
                {pendingStatementLineCount}
              </VarianceValue>
            </ControlLine>
            <ControlLine>
              <Label>Write-off</Label>
              <Value>{writtenOffStatementLineCount}</Value>
            </ControlLine>
          </>
        ) : null}
      </ControlStack>
    </Panel>
  </Rail>
);

const Rail = styled.aside`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  min-width: 0;
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const PanelHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const PanelTitle = styled.h3`
  margin: 0;
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
`;

const PanelCopy = styled.p`
  margin: 2px 0 0;
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-text-secondary);
`;

const ControlStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
`;

const ControlLine = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const Label = styled.span`
  font-size: var(--ds-font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--ds-color-text-secondary);
`;

const Value = styled.span`
  text-align: right;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
`;

const VarianceValue = styled(Value)<{ $warning: boolean }>`
  color: ${({ $warning }) =>
    $warning
      ? 'var(--ds-color-state-warningText)'
      : 'var(--ds-color-state-successText)'};
`;
