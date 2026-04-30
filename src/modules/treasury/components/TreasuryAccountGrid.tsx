import { Button, Empty, Tooltip, Typography } from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  EyeOutlined,
  PoweroffOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import { DateTime } from 'luxon';
import styled from 'styled-components';

import type {
  BankAccount,
  BankReconciliationRecord,
  CashAccount,
  LiquidityLedgerEntry,
} from '@/types/accounting';
import type { TreasuryLiquidityAccount } from '@/modules/treasury/utils/liquidity';
import { toMillis } from '@/utils/firebase/toTimestamp';

const { Text } = Typography;

export type TreasuryAccountView = 'bank' | 'cash';
type StatusTone = 'success' | 'warning';

interface TreasuryAccountGridProps {
  currentBalancesByAccountKey: Record<string, number>;
  latestReconciliationsByBankAccountId: Record<
    string,
    BankReconciliationRecord
  >;
  ledgerEntriesByAccountKey: Record<string, LiquidityLedgerEntry[]>;
  onConfigureAccount: (account: TreasuryLiquidityAccount) => void;
  onOpenReconciliation: (account: TreasuryLiquidityAccount) => void;
  onOpenTransfer: (account: TreasuryLiquidityAccount) => void;
  onToggleAccountStatus: (account: TreasuryLiquidityAccount) => void;
  onSelectAccount: (account: TreasuryLiquidityAccount) => void;
  accounts: TreasuryLiquidityAccount[];
  selectedAccountKey?: string | null;
  view: TreasuryAccountView;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const getAccountTitle = (account: TreasuryLiquidityAccount) =>
  account.source.name;

const BANK_ACCOUNT_TYPE_LABELS: Record<
  NonNullable<BankAccount['type']>,
  string
> = {
  checking: 'Cuenta corriente',
  savings: 'Cuenta ahorro',
  credit_card: 'Tarjeta de crédito',
  other: 'Otra',
};

const CASH_ACCOUNT_TYPE_LABELS: Record<
  NonNullable<CashAccount['type']>,
  string
> = {
  register: 'Caja registradora',
  petty_cash: 'Caja chica',
  vault: 'Caja fuerte',
  other: 'Otra',
};

const getBankAccountTypeLabel = (account: TreasuryLiquidityAccount) => {
  const type = (account.source as BankAccount).type;
  return type ? BANK_ACCOUNT_TYPE_LABELS[type] : 'Cuenta bancaria';
};

const getCashAccountTypeLabel = (account: TreasuryLiquidityAccount) => {
  const type = (account.source as CashAccount).type;
  return type ? CASH_ACCOUNT_TYPE_LABELS[type] : 'Caja';
};

const formatAccountNumber = (account: TreasuryLiquidityAccount) => {
  const last4 = (account.source as BankAccount).accountNumberLast4;
  return last4 ? `****${last4}` : '—';
};

const formatDate = (value: unknown) => {
  const millis = toMillis(value as never);
  return millis ? DateTime.fromMillis(millis).toFormat('yyyy-MM-dd') : '—';
};

const getLatestMovementDate = (
  account: TreasuryLiquidityAccount,
  ledgerEntriesByAccountKey: Record<string, LiquidityLedgerEntry[]>,
) => {
  const entries = ledgerEntriesByAccountKey[account.key] ?? [];
  const latestMillis = entries.reduce((latest, entry) => {
    const entryMillis = toMillis(
      (entry.occurredAt ?? entry.createdAt) as never,
    );
    return entryMillis && entryMillis > latest ? entryMillis : latest;
  }, 0);

  return latestMillis
    ? DateTime.fromMillis(latestMillis).toFormat('yyyy-MM-dd')
    : '—';
};

const getReconciliationStatus = (
  account: TreasuryLiquidityAccount,
  latestReconciliationsByBankAccountId: Record<
    string,
    BankReconciliationRecord
  >,
) => {
  const reconciliation = latestReconciliationsByBankAccountId[account.id];
  if (!reconciliation) {
    return 'pending';
  }

  return reconciliation.status === 'variance' ? 'pending' : 'reconciled';
};

export const TreasuryAccountGrid = ({
  currentBalancesByAccountKey,
  latestReconciliationsByBankAccountId,
  ledgerEntriesByAccountKey,
  onConfigureAccount,
  onOpenReconciliation,
  onOpenTransfer,
  onToggleAccountStatus,
  onSelectAccount,
  accounts,
  selectedAccountKey,
  view,
}: TreasuryAccountGridProps) => {
  if (!accounts.length) {
    return (
      <EmptyState>
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            view === 'bank'
              ? 'Todavía no hay cuentas bancarias.'
              : 'Todavía no hay cajas.'
          }
        />
      </EmptyState>
    );
  }

  return (
    <Panel>
      <TableViewport>
        <AccountsTable $view={view}>
          <thead>
            {view === 'bank' ? (
              <tr>
                <HeaderCell>Banco</HeaderCell>
                <HeaderCell>Tipo de cuenta</HeaderCell>
                <HeaderCell>Número</HeaderCell>
                <HeaderCell>Moneda</HeaderCell>
                <HeaderCell $align="right">Saldo actual</HeaderCell>
                <HeaderCell>Último mov.</HeaderCell>
                <HeaderCell>Conciliada</HeaderCell>
                <HeaderCell>Estado</HeaderCell>
                <HeaderCell $align="right">Acciones</HeaderCell>
              </tr>
            ) : (
              <tr>
                <HeaderCell>Nombre</HeaderCell>
                <HeaderCell>Ubicación</HeaderCell>
                <HeaderCell>Responsable</HeaderCell>
                <HeaderCell>Moneda</HeaderCell>
                <HeaderCell $align="right">Saldo</HeaderCell>
                <HeaderCell>Último mov.</HeaderCell>
                <HeaderCell>Turno</HeaderCell>
                <HeaderCell>Estado</HeaderCell>
                <HeaderCell $align="right">Acciones</HeaderCell>
              </tr>
            )}
          </thead>
          <tbody>
            {accounts.map((account) => {
              const currentBalance =
                currentBalancesByAccountKey[account.key] ?? 0;
              const isSelected = selectedAccountKey === account.key;
              const latestMovementDate = getLatestMovementDate(
                account,
                ledgerEntriesByAccountKey,
              );
              const reconciliationStatus =
                view === 'bank'
                  ? getReconciliationStatus(
                      account,
                      latestReconciliationsByBankAccountId,
                    )
                  : null;
              const bankAccount = account.source as BankAccount;
              const cashAccount = account.source as CashAccount;

              return (
                <AccountRow
                  key={account.key}
                  $selected={isSelected}
                  onClick={() => onSelectAccount(account)}
                >
                  {view === 'bank' ? (
                    <>
                      <BodyCell>
                        <PrimaryCell>
                          <StrongText>
                            {account.institutionName ||
                              getAccountTitle(account)}
                          </StrongText>
                          {account.institutionName ? (
                            <MetaLine>{getAccountTitle(account)}</MetaLine>
                          ) : null}
                        </PrimaryCell>
                      </BodyCell>
                      <BodyCell>{getBankAccountTypeLabel(account)}</BodyCell>
                      <BodyCell>
                        <MutedValue>{formatAccountNumber(account)}</MutedValue>
                      </BodyCell>
                      <BodyCell>
                        <CurrencyBadge>{account.currency}</CurrencyBadge>
                      </BodyCell>
                      <BodyCell $align="right">
                        <MoneyValue>
                          {formatMoney(currentBalance, account.currency)}
                        </MoneyValue>
                      </BodyCell>
                      <BodyCell>
                        <MutedValue>
                          {formatDate(
                            bankAccount.updatedAt ?? bankAccount.lastChangedAt,
                          ) !== '—'
                            ? formatDate(
                                bankAccount.updatedAt ??
                                  bankAccount.lastChangedAt,
                              )
                            : latestMovementDate}
                        </MutedValue>
                      </BodyCell>
                      <BodyCell>
                        <StatusPill
                          $tone={
                            reconciliationStatus === 'reconciled'
                              ? 'success'
                              : 'warning'
                          }
                        >
                          <StatusDot
                            $tone={
                              reconciliationStatus === 'reconciled'
                                ? 'success'
                                : 'warning'
                            }
                          />
                          {reconciliationStatus === 'reconciled'
                            ? 'Conciliada'
                            : 'Pendiente'}
                        </StatusPill>
                      </BodyCell>
                    </>
                  ) : (
                    <>
                      <BodyCell>
                        <PrimaryCell>
                          <StrongText>{getAccountTitle(account)}</StrongText>
                          <MetaLine>
                            {getCashAccountTypeLabel(account)}
                          </MetaLine>
                        </PrimaryCell>
                      </BodyCell>
                      <BodyCell>
                        <MutedValue>{account.location || '—'}</MutedValue>
                      </BodyCell>
                      <BodyCell>
                        <MutedValue>{cashAccount.createdBy || '—'}</MutedValue>
                      </BodyCell>
                      <BodyCell>
                        <CurrencyBadge>{account.currency}</CurrencyBadge>
                      </BodyCell>
                      <BodyCell $align="right">
                        <MoneyValue>
                          {formatMoney(currentBalance, account.currency)}
                        </MoneyValue>
                      </BodyCell>
                      <BodyCell>
                        <MutedValue>
                          {formatDate(
                            cashAccount.updatedAt ?? cashAccount.lastChangedAt,
                          ) !== '—'
                            ? formatDate(
                                cashAccount.updatedAt ??
                                  cashAccount.lastChangedAt,
                              )
                            : latestMovementDate}
                        </MutedValue>
                      </BodyCell>
                      <BodyCell>
                        <MutedValue>—</MutedValue>
                      </BodyCell>
                    </>
                  )}
                  <BodyCell>
                    <StatusPill
                      $tone={
                        account.status === 'active' ? 'success' : 'warning'
                      }
                    >
                      <StatusDot
                        $tone={
                          account.status === 'active' ? 'success' : 'warning'
                        }
                      />
                      {view === 'cash'
                        ? account.status === 'active'
                          ? 'Abierta'
                          : 'Cerrada'
                        : account.status === 'active'
                          ? 'Activa'
                          : 'Inactiva'}
                    </StatusPill>
                  </BodyCell>
                  <BodyCell $align="right">
                    <ActionsRow>
                      <Tooltip title="Ver detalle">
                        <Button
                          aria-label="Ver detalle"
                          icon={<EyeOutlined />}
                          size="small"
                          type="text"
                          onClick={(event) => {
                            event.stopPropagation();
                            onSelectAccount(account);
                          }}
                        />
                      </Tooltip>
                      <Tooltip title="Transferir">
                        <Button
                          aria-label="Transferir"
                          icon={<RetweetOutlined />}
                          size="small"
                          type="text"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenTransfer(account);
                          }}
                        />
                      </Tooltip>
                      {view === 'bank' ? (
                        <Tooltip title="Conciliar">
                          <Button
                            aria-label="Conciliar"
                            icon={<CheckCircleOutlined />}
                            size="small"
                            type="text"
                            onClick={(event) => {
                              event.stopPropagation();
                              onOpenReconciliation(account);
                            }}
                          />
                        </Tooltip>
                      ) : null}
                      <Tooltip title="Configurar">
                        <Button
                          aria-label="Configurar"
                          icon={<EditOutlined />}
                          size="small"
                          type="text"
                          onClick={(event) => {
                            event.stopPropagation();
                            onConfigureAccount(account);
                          }}
                        />
                      </Tooltip>
                      <Tooltip
                        title={
                          account.status === 'active' ? 'Desactivar' : 'Activar'
                        }
                      >
                        <Button
                          aria-label={
                            account.status === 'active'
                              ? 'Desactivar'
                              : 'Activar'
                          }
                          icon={<PoweroffOutlined />}
                          size="small"
                          type="text"
                          onClick={(event) => {
                            event.stopPropagation();
                            onToggleAccountStatus(account);
                          }}
                        />
                      </Tooltip>
                    </ActionsRow>
                  </BodyCell>
                </AccountRow>
              );
            })}
          </tbody>
        </AccountsTable>
      </TableViewport>
    </Panel>
  );
};

const EmptyState = styled.div`
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  padding: var(--ds-space-6);
`;

const Panel = styled.section`
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
  box-shadow: var(--ds-shadow-sm);
`;

const TableViewport = styled.div`
  overflow-x: auto;
`;

const AccountsTable = styled.table<{ $view: TreasuryAccountView }>`
  width: 100%;
  min-width: ${({ $view }) => ($view === 'bank' ? '1080px' : '980px')};
  border-collapse: collapse;
`;

const HeaderCell = styled.th<{ $align?: 'left' | 'right' }>`
  padding: var(--ds-space-3) var(--ds-space-4);
  background: var(--ds-color-bg-subtle);
  border-bottom: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
  text-align: ${({ $align }) => $align ?? 'left'};
  text-transform: uppercase;
  letter-spacing: 0;
  white-space: nowrap;
`;

const AccountRow = styled.tr<{ $selected: boolean }>`
  border-left: 3px solid
    ${({ $selected }) =>
      $selected
        ? 'var(--ds-color-interactive-selected-border)'
        : 'transparent'};
  cursor: pointer;

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
  }
`;

const BodyCell = styled.td<{ $align?: 'left' | 'right' }>`
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
  text-align: ${({ $align }) => $align ?? 'left'};
  vertical-align: middle;
  white-space: nowrap;
`;

const PrimaryCell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const StrongText = styled.span`
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-semibold);
`;

const MetaLine = styled(Text).attrs({ type: 'secondary' })`
  && {
    display: block;
    margin-top: 2px;
    font-size: var(--ds-font-size-sm);
  }
`;

const MoneyValue = styled.span`
  font-weight: var(--ds-font-weight-semibold);
  color: var(--ds-color-text-primary);
  font-variant-numeric: tabular-nums;
`;

const CurrencyBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 22px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const MutedValue = styled.span`
  color: var(--ds-color-text-secondary);
  font-variant-numeric: tabular-nums;
`;

const StatusPill = styled.span<{ $tone: StatusTone }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 74px;
  padding: 2px var(--ds-space-2);
  border-radius: var(--ds-radius-sm);
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success-subtle)'
      : 'var(--ds-color-state-warning-subtle)'};
  color: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-state-warning-text)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const StatusDot = styled.span<{ $tone: StatusTone }>`
  width: 5px;
  height: 5px;
  border-radius: 999px;
  background: ${({ $tone }) =>
    $tone === 'success'
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-state-warning-text)'};
`;

const ActionsRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 2px;
`;
