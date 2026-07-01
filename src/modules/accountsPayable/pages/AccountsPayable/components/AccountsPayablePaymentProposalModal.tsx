import { Alert, Button, Empty, Modal, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format/formatPrice';

import type { AccountsPayableRow } from '../utils/accountsPayableDashboard';
import {
  resolveAccountsPayableProposalCashSnapshot,
  type AccountsPayablePaymentProposal,
} from '../utils/accountsPayablePaymentProposal';

const { Text, Title } = Typography;

const formatDate = (value: number | null): string =>
  value
    ? new Intl.DateTimeFormat('es-DO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(value)
    : 'Sin fecha';

const ProposalAmountStack = ({ row }: { row: AccountsPayableRow }) => {
  const cashSnapshot = resolveAccountsPayableProposalCashSnapshot(row);

  return (
    <AmountStack>
      <strong>{formatPrice(cashSnapshot.cashRequirementAmount)}</strong>
      <span>Balance {formatPrice(cashSnapshot.grossBalanceAmount)}</span>
      {cashSnapshot.withholdingAmount > 0 ? (
        <span>Ret. {formatPrice(cashSnapshot.withholdingAmount)}</span>
      ) : null}
    </AmountStack>
  );
};

const ProposalAccountingLine = ({ row }: { row: AccountsPayableRow }) => (
  <AccountingMetaLine>
    <Tag color={row.accountingSnapshot.posted ? 'green' : 'gold'}>
      {row.accountingSnapshot.statusLabel}
    </Tag>
    <Text type="secondary">
      {row.accountingSnapshot.documentNatureLabel} ·{' '}
      {row.accountingSnapshot.settlementTimingLabel}
    </Text>
  </AccountingMetaLine>
);

interface AccountsPayablePaymentProposalModalProps {
  canRegisterPayments: boolean;
  createRunIcon?: ReactNode;
  creatingRun?: boolean;
  onClose: () => void;
  onCreateRun?: () => void;
  onOpenDetail: (row: AccountsPayableRow) => void;
  onRegisterPayment: (row: AccountsPayableRow) => void;
  open: boolean;
  paymentRunBlockedReason?: string | null;
  proposal: AccountsPayablePaymentProposal;
  scopeDescription: string;
  scopeLabel: string;
}

export const AccountsPayablePaymentProposalModal = ({
  canRegisterPayments,
  createRunIcon,
  creatingRun = false,
  onClose,
  onCreateRun,
  onOpenDetail,
  onRegisterPayment,
  open,
  paymentRunBlockedReason = null,
  proposal,
  scopeDescription,
  scopeLabel,
}: AccountsPayablePaymentProposalModalProps) => {
  const topRows = proposal.recommendedRows.slice(0, 8);
  const topRowIds = new Set(topRows.map((row) => row.id));
  const topExclusions = proposal.exclusionSummaries.slice(0, 4);
  const topDueSoonRows = proposal.dueSoonRows
    .filter((row) => !topRowIds.has(row.id))
    .slice(0, 4);
  const topReviewRows = proposal.reviewRows.slice(0, 4);
  const topSuppliers = proposal.supplierSummaries.slice(0, 5);
  const canSavePaymentRun =
    canRegisterPayments &&
    !paymentRunBlockedReason &&
    !creatingRun &&
    proposal.recommendedRows.length > 0;

  return (
    <Modal
      destroyOnHidden
      footer={null}
      onCancel={onClose}
      open={open}
      title="Propuesta de pago CxP"
      width={900}
      style={{ maxWidth: 'calc(100vw - 32px)' }}
    >
      <Content>
        <Alert
          showIcon
          type="info"
          title={scopeLabel}
          description={scopeDescription}
        />

        {onCreateRun && paymentRunBlockedReason ? (
          <Alert
            showIcon
            type="warning"
            title="Alcance limitado para corrida"
            description={paymentRunBlockedReason}
          />
        ) : null}

        {onCreateRun ? (
          <RunActionBar>
            <Text type="secondary">
              {proposal.recommendedRows.length} cuenta
              {proposal.recommendedRows.length === 1 ? '' : 's'} con
              vencimiento
            </Text>
            <Button
              disabled={!canSavePaymentRun}
              icon={createRunIcon}
              loading={creatingRun}
              type="primary"
              onClick={onCreateRun}
            >
              {canRegisterPayments ? 'Guardar corrida' : 'Sin permiso'}
            </Button>
          </RunActionBar>
        ) : null}

        <SummaryGrid>
          <Metric>
            <span>Caja estimada</span>
            <strong>
              {formatPrice(proposal.eligibleCashRequirementAmount)}
            </strong>
            <small>{proposal.eligibleCount} cuentas aprobadas</small>
          </Metric>
          <Metric>
            <span>Liberado bruto</span>
            <strong>{formatPrice(proposal.eligibleAmount)}</strong>
            <small>Balance abierto aprobado</small>
          </Metric>
          <Metric>
            <span>Vencido</span>
            <strong>{formatPrice(proposal.overdueAmount)}</strong>
            <small>Prioridad de pago</small>
          </Metric>
          <Metric>
            <span>Retenciones</span>
            <strong>{formatPrice(proposal.eligibleWithholdingAmount)}</strong>
            <small>ITBIS/ISR estimado</small>
          </Metric>
          <Metric>
            <span>Sin fecha</span>
            <strong>{formatPrice(proposal.noDueDateAmount)}</strong>
            <small>{proposal.noDueDateCount} por revisar</small>
          </Metric>
          <Metric>
            <span>Excluido</span>
            <strong>{formatPrice(proposal.blockedAmount)}</strong>
            <small>{proposal.blockedCount} con control activo</small>
          </Metric>
        </SummaryGrid>

        {proposal.blockedCount > 0 ? (
          <ExclusionBlock>
            <Alert
              showIcon
              type="warning"
              title={`${proposal.blockedCount} cuenta${
                proposal.blockedCount === 1 ? '' : 's'
              } excluida${proposal.blockedCount === 1 ? '' : 's'} por controles antes de pago.`}
            />
            <ExclusionList aria-label="Desglose de cuentas excluidas">
              {topExclusions.map((summary) => (
                <ExclusionRow key={summary.status}>
                  <div>
                    <strong>{summary.label}</strong>
                    <span>
                      {summary.count} cuenta{summary.count === 1 ? '' : 's'}
                      {summary.reasons.length > 0
                        ? ` · ${summary.reasons.slice(0, 2).join(' · ')}`
                        : ' · Sin motivo capturado'}
                    </span>
                  </div>
                  <strong>{formatPrice(summary.amount)}</strong>
                </ExclusionRow>
              ))}
            </ExclusionList>
          </ExclusionBlock>
        ) : null}

        {proposal.noDueDateCount > 0 ? (
          <Alert
            showIcon
            type="warning"
            title={`${proposal.noDueDateCount} cuenta${
              proposal.noDueDateCount === 1 ? '' : 's'
            } liberada${proposal.noDueDateCount === 1 ? '' : 's'} sin vencimiento.`}
            description="No entra en la prioridad sugerida hasta completar o confirmar la fecha de vencimiento."
          />
        ) : null}

        {topDueSoonRows.length > 0 ? (
          <DueSoonBlock>
            <SectionHeader>
              <Title level={5}>Liquidez próxima</Title>
              <Text type="secondary">
                {topDueSoonRows.length} de {proposal.dueSoonCount}
              </Text>
            </SectionHeader>
            <RowsList>
              {topDueSoonRows.map((row) => (
                <ProposalRow key={row.id}>
                  <RowMain>
                    <strong>{row.reference}</strong>
                    <span>{row.providerName}</span>
                    <MetaLine>
                      <Tag color="gold">{row.agingLabel}</Tag>
                      <Text type="secondary">
                        Vence {formatDate(row.dueAt)}
                      </Text>
                    </MetaLine>
                    <ProposalAccountingLine row={row} />
                  </RowMain>
                  <RowAmount>
                    <ProposalAmountStack row={row} />
                    <Button
                      disabled={!canRegisterPayments}
                      size="small"
                      onClick={() => {
                        if (!canRegisterPayments) return;
                        onRegisterPayment(row);
                      }}
                    >
                      {canRegisterPayments ? 'Registrar pago' : 'Sin permiso'}
                    </Button>
                    <Button
                      size="small"
                      type="text"
                      onClick={() => {
                        onOpenDetail(row);
                      }}
                    >
                      Detalle
                    </Button>
                  </RowAmount>
                </ProposalRow>
              ))}
            </RowsList>
          </DueSoonBlock>
        ) : null}

        {proposal.eligibleCount === 0 ? (
          <Empty description="No hay cuentas aprobadas para proponer pago con los filtros actuales." />
        ) : (
          <Workspace>
            <Section>
              <SectionHeader>
                <Title level={5}>Prioridad sugerida</Title>
                <Text type="secondary">
                  {topRows.length} de {proposal.recommendedRows.length}
                </Text>
              </SectionHeader>
              {topRows.length === 0 ? (
                <Empty
                  description="No hay cuentas con vencimiento para priorizar."
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              ) : (
                <RowsList>
                  {topRows.map((row) => (
                    <ProposalRow key={row.id}>
                      <RowMain>
                        <strong>{row.reference}</strong>
                        <span>{row.providerName}</span>
                        <MetaLine>
                          <Tag
                            color={row.agingTone === 'danger' ? 'red' : 'gold'}
                          >
                            {row.agingLabel}
                          </Tag>
                          <Text type="secondary">
                            Vence {formatDate(row.dueAt)}
                          </Text>
                        </MetaLine>
                        <ProposalAccountingLine row={row} />
                      </RowMain>
                      <RowAmount>
                        <ProposalAmountStack row={row} />
                        <Button
                          disabled={!canRegisterPayments}
                          size="small"
                          onClick={() => {
                            if (!canRegisterPayments) return;
                            onRegisterPayment(row);
                          }}
                        >
                          {canRegisterPayments
                            ? 'Registrar pago'
                            : 'Sin permiso'}
                        </Button>
                        <Button
                          size="small"
                          type="text"
                          onClick={() => {
                            onOpenDetail(row);
                          }}
                        >
                          Detalle
                        </Button>
                      </RowAmount>
                    </ProposalRow>
                  ))}
                </RowsList>
              )}
            </Section>

            <Section>
              <SectionHeader>
                <Title level={5}>Concentración por proveedor</Title>
                <Text type="secondary">
                  {proposal.supplierSummaries.length} proveedor
                  {proposal.supplierSummaries.length === 1 ? '' : 'es'}
                </Text>
              </SectionHeader>
              <SupplierList>
                {topSuppliers.map((supplier) => (
                  <SupplierRow
                    key={supplier.providerId ?? supplier.providerName}
                  >
                    <div>
                      <strong>{supplier.providerName}</strong>
                      <span>
                        {supplier.count} cuenta{supplier.count === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div>
                      <strong>
                        {formatPrice(supplier.cashRequirementAmount)}
                      </strong>
                      <span>Balance {formatPrice(supplier.balanceAmount)}</span>
                      {supplier.withholdingAmount > 0 ? (
                        <span>
                          Ret. {formatPrice(supplier.withholdingAmount)}
                        </span>
                      ) : null}
                      <span>Vencido {formatPrice(supplier.overdueAmount)}</span>
                    </div>
                  </SupplierRow>
                ))}
              </SupplierList>
            </Section>

            {topReviewRows.length > 0 ? (
              <ReviewSection>
                <SectionHeader>
                  <Title level={5}>Requiere vencimiento</Title>
                  <Text type="secondary">
                    {topReviewRows.length} de {proposal.noDueDateCount}
                  </Text>
                </SectionHeader>
                <RowsList>
                  {topReviewRows.map((row) => (
                    <ProposalRow key={row.id}>
                      <RowMain>
                        <strong>{row.reference}</strong>
                        <span>{row.providerName}</span>
                        <MetaLine>
                          <Tag color="default">{row.agingLabel}</Tag>
                          <Text type="secondary">
                            Balance {formatPrice(row.balanceAmount)}
                          </Text>
                        </MetaLine>
                        <ProposalAccountingLine row={row} />
                      </RowMain>
                      <RowAmount>
                        <ProposalAmountStack row={row} />
                        <Button
                          size="small"
                          type="text"
                          onClick={() => {
                            onOpenDetail(row);
                          }}
                        >
                          Detalle
                        </Button>
                      </RowAmount>
                    </ProposalRow>
                  ))}
                </RowsList>
              </ReviewSection>
            ) : null}
          </Workspace>
        )}
      </Content>
    </Modal>
  );
};

const Content = styled.div`
  display: grid;
  gap: 16px;
  min-width: 0;
`;

const RunActionBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  @media (width <= 560px) {
    align-items: stretch;
    flex-direction: column;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;

  @media (width <= 720px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Metric = styled.div`
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fff;

  span,
  small {
    color: #667085;
  }

  span {
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
  }

  strong {
    color: #111827;
    font-size: 18px;
  }
`;

const ExclusionBlock = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const ExclusionList = styled.div`
  display: grid;
  gap: 0;
  min-width: 0;
  border-top: 1px solid #f1d9a7;
`;

const ExclusionRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  min-width: 0;
  padding: 8px 0;
  border-bottom: 1px solid #f1d9a7;

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  span {
    overflow: hidden;
    color: #667085;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  strong:last-child {
    color: #111827;
  }

  @media (width <= 560px) {
    grid-template-columns: 1fr;

    span {
      white-space: normal;
    }
  }
`;

const DueSoonBlock = styled.section`
  display: grid;
  gap: 10px;
  min-width: 0;
  padding: 12px 14px;
  border: 1px solid #f1d9a7;
  border-radius: 8px;
  background: #fffdf7;
`;

const Workspace = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.5fr) minmax(260px, 0.85fr);
  gap: 16px;
  min-width: 0;

  @media (width <= 820px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.section`
  display: grid;
  gap: 10px;
  min-width: 0;
`;

const ReviewSection = styled(Section)`
  grid-column: 1 / -1;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  min-width: 0;

  h5 {
    margin: 0;
  }
`;

const RowsList = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const ProposalRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  min-width: 0;
  padding: 10px 0;
  border-bottom: 1px solid #edf0f3;

  @media (width <= 640px) {
    grid-template-columns: 1fr;
  }
`;

const RowMain = styled.div`
  display: grid;
  gap: 3px;
  min-width: 0;

  span {
    overflow: hidden;
    color: #4b5563;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const MetaLine = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
`;

const AccountingMetaLine = styled(MetaLine)`
  color: #667085;
  font-size: 12px;
`;

const RowAmount = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  min-width: 0;

  @media (width <= 640px) {
    justify-content: flex-start;
  }
`;

const AmountStack = styled.div`
  display: grid;
  gap: 2px;
  justify-items: end;
  min-width: 112px;

  strong {
    color: #111827;
    text-align: right;
    white-space: nowrap;
  }

  span {
    color: #667085;
    font-size: 12px;
    line-height: 1.25;
    text-align: right;
    white-space: nowrap;
  }

  @media (width <= 640px) {
    justify-items: start;
    min-width: 0;

    strong,
    span {
      text-align: left;
    }
  }
`;

const SupplierList = styled.div`
  display: grid;
  gap: 8px;
  min-width: 0;
`;

const SupplierRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  min-width: 0;
  padding: 10px 0;
  border-bottom: 1px solid #edf0f3;

  div {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  div:last-child {
    justify-items: end;
  }

  span {
    color: #667085;
    font-size: 12px;
  }
`;
