import { Button, Popconfirm } from 'antd';
import styled from 'styled-components';

import { Modal } from '@/components/common/Modal/Modal';

import { resolveAccountingOriginTarget } from '../utils/accountingOrigin';
import {
  formatAccountingDate,
  formatAccountingMoney,
} from '../utils/accountingWorkspace';

import type { AccountingLedgerRecord } from '../utils/accountingWorkspace';

const TECHNICAL_CODEX_DOCUMENT_PATTERN =
  /^codex-(?<type>[a-z]+)-(?<source>[a-z]+)-(?<sequence>\d+)$/i;

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  exp: 'Gasto',
  expense: 'Gasto',
  inv: 'Factura',
  invoice: 'Factura',
  pay: 'Pago',
  payment: 'Pago',
  transfer: 'Transferencia',
};

const DOCUMENT_SOURCE_LABELS: Record<string, string> = {
  bank: 'banco',
  cash: 'caja',
  sale: 'venta',
  purchase: 'compra',
  vendor: 'proveedor',
};

const formatVisibleDocumentReference = (value: string | null): string | null => {
  if (!value) {
    return null;
  }

  const match = value.match(TECHNICAL_CODEX_DOCUMENT_PATTERN);
  const groups = match?.groups;
  if (!groups) {
    return value;
  }

  const typeLabel = DOCUMENT_TYPE_LABELS[groups.type.toLowerCase()] ?? 'Documento';
  const sourceLabel =
    DOCUMENT_SOURCE_LABELS[groups.source.toLowerCase()] ?? groups.source;
  const shortFolio = groups.sequence.slice(-4).padStart(4, '0');
  return `${typeLabel} ${sourceLabel} #${shortFolio}`;
};

interface JournalEntryDetailDrawerProps {
  onClose: () => void;
  open: boolean;
  onOpenOrigin?: (record: AccountingLedgerRecord | null) => Promise<boolean>;
  onReverseEntry?: (
    entry: NonNullable<AccountingLedgerRecord['journalEntry']>,
  ) => Promise<boolean>;
  openingOrigin?: boolean;
  record: AccountingLedgerRecord | null;
  reversing?: boolean;
}

export const JournalEntryDetailDrawer = ({
  onClose,
  onOpenOrigin,
  onReverseEntry,
  openingOrigin = false,
  open,
  record,
  reversing = false,
}: JournalEntryDetailDrawerProps) => {
  const canReverse =
    record?.detailMode === 'posted' &&
    record.journalEntry?.status === 'posted';
  const originTarget = resolveAccountingOriginTarget(record);
  const visibleDocumentReference =
    record?.documentReference && record.documentReference !== record.entryReference
      ? record.documentReference
      : record?.reference && record.reference !== record.entryReference
        ? record.reference
        : null;
  const documentLabel = formatVisibleDocumentReference(visibleDocumentReference);

  return (
    <Modal
      destroyOnHidden
      footer={null}
      title={record?.title ?? 'Detalle del asiento'}
      width={820}
      open={open}
      onCancel={onClose}
    >
      {record ? (
        <ModalBody>
          <SummaryCard>
            <SummaryHeader>
              <SummaryEyebrow>Libro diario</SummaryEyebrow>
              <SummaryBadges>
                <HeaderBadge>{record.statusLabel}</HeaderBadge>
                <HeaderBadge>
                  {record.detailMode === 'posted'
                    ? 'Asiento posteado'
                    : 'Vista previa'}
                </HeaderBadge>
              </SummaryBadges>
            </SummaryHeader>

            <SummaryReference>{record.entryReference}</SummaryReference>
            <Description>{record.description}</Description>
          </SummaryCard>

          <HeaderBlock>
            <MetaGrid>
              <MetaRow>
                <MetaLabel>Fecha</MetaLabel>
                <MetaValue>{formatAccountingDate(record.entryDate)}</MetaValue>
              </MetaRow>
              <MetaRow>
                <MetaLabel>Origen</MetaLabel>
                <MetaValue>{record.sourceLabel}</MetaValue>
              </MetaRow>
              <MetaRow>
                <MetaLabel>Modulo</MetaLabel>
                <MetaValue>{record.moduleLabel}</MetaValue>
              </MetaRow>
              {documentLabel ? (
                <MetaRow>
                  <MetaLabel>Documento</MetaLabel>
                  <MetaValue title={visibleDocumentReference ?? undefined}>
                    {documentLabel}
                  </MetaValue>
                </MetaRow>
              ) : null}
              {record.journalEntry?.reversalOfEntryId ? (
                <MetaRow>
                  <MetaLabel>Reversa de</MetaLabel>
                  <MetaValue>{record.journalEntry.reversalOfEntryId}</MetaValue>
                </MetaRow>
              ) : null}
            </MetaGrid>
          </HeaderBlock>

          <LinesTableShell>
            <LinesTable>
              <thead>
                <tr>
                  <th>Cuenta</th>
                  <th>Detalle</th>
                  <th>Debito</th>
                  <th>Credito</th>
                </tr>
              </thead>
              <tbody>
                {record.lines.map((line) => (
                  <tr key={`${record.id}-${line.lineNumber}`}>
                    <AccountCell>
                      <strong>{line.accountCode ?? 'Sin codigo'}</strong>
                      <span>{line.accountName ?? 'Cuenta sin nombre'}</span>
                    </AccountCell>
                    <DetailCell>
                      {line.description ?? 'Sin detalle adicional'}
                    </DetailCell>
                    <NumericCell $tone="debit">
                      {line.debit ? formatAccountingMoney(line.debit) : '-'}
                    </NumericCell>
                    <NumericCell $tone="credit">
                      {line.credit ? formatAccountingMoney(line.credit) : '-'}
                    </NumericCell>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <NumericCell $tone="debit">
                    {formatAccountingMoney(
                      record.lines.reduce((sum, line) => sum + line.debit, 0),
                    )}
                  </NumericCell>
                  <NumericCell $tone="credit">
                    {formatAccountingMoney(
                      record.lines.reduce((sum, line) => sum + line.credit, 0),
                    )}
                  </NumericCell>
                </tr>
              </tfoot>
            </LinesTable>
          </LinesTableShell>

          {originTarget || (canReverse && record.journalEntry) ? (
            <ActionRow>
              {originTarget ? (
                <Button
                  loading={openingOrigin}
                  onClick={() => void onOpenOrigin?.(record)}
                >
                  {originTarget.label}
                </Button>
              ) : null}

              {canReverse && record.journalEntry && onReverseEntry ? (
                <Popconfirm
                  okText="Reversar"
                  cancelText="Cancelar"
                  placement="left"
                  title="Reversar asiento"
                  description="Se creara un nuevo asiento con los importes invertidos y el original quedara marcado como revertido."
                  onConfirm={() => void onReverseEntry(record.journalEntry!)}
                >
                  <Button danger loading={reversing}>
                    Reversar asiento
                  </Button>
                </Popconfirm>
              ) : null}
            </ActionRow>
          ) : null}
        </ModalBody>
      ) : null}
    </Modal>
  );
};

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6);
`;

const SummaryCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const SummaryHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const SummaryEyebrow = styled.span`
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-secondary);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const SummaryBadges = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
`;

const HeaderBadge = styled.span`
  display: inline-flex;
  align-items: center;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  line-height: 1;
`;

const SummaryReference = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
`;

const HeaderBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const MetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
`;

const MetaLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  color: var(--ds-color-text-secondary);
  font-weight: var(--ds-font-weight-medium);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
`;

const MetaValue = styled.strong`
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-tight);
  color: var(--ds-color-text-primary);
  font-weight: var(--ds-font-weight-medium);
`;

const Description = styled.p`
  margin: 0;
  font-size: var(--ds-font-size-base);
  line-height: var(--ds-line-height-relaxed);
  color: var(--ds-color-text-secondary);
`;

const LinesTableShell = styled.div`
  overflow: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const LinesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 540px;

  th,
  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    vertical-align: top;
    text-align: left;
    font-size: var(--ds-font-size-base);
    line-height: var(--ds-line-height-normal);
  }

  th {
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    color: var(--ds-color-text-secondary);
    font-weight: var(--ds-font-weight-semibold);
    background: var(--ds-color-bg-subtle);
  }

  tfoot td {
    background: var(--ds-color-bg-subtle);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }
`;

const AccountCell = styled.td`
  display: flex;
  flex-direction: column;
  gap: 2px;

  strong {
    color: var(--ds-color-text-primary);
    font-family: var(--ds-font-family-mono, monospace);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-medium);
    font-variant-numeric: tabular-nums;
  }

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;

const DetailCell = styled.td`
  color: var(--ds-color-text-secondary);
`;

const NumericCell = styled.td<{ $tone?: 'debit' | 'credit' }>`
  color: ${({ $tone }) =>
    $tone === 'debit'
      ? 'var(--ds-color-state-success-text, #166534)'
      : $tone === 'credit'
        ? 'var(--ds-color-state-danger-text, #b42318)'
        : 'var(--ds-color-text-primary)'};
  font-family: var(--ds-font-family-mono, monospace);
  font-variant-numeric: tabular-nums;
  text-align: right;
  white-space: nowrap;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-3);

  @media (max-width: 560px) {
    flex-direction: column;
    align-items: stretch;
  }
`;
