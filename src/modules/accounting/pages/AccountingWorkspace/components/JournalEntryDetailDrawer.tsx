import { Alert, Button, Popconfirm } from 'antd';
import styled from 'styled-components';

import { Modal } from '@/components/common/Modal/Modal';

import { resolveAccountingOriginTarget } from '../utils/accountingOrigin';
import {
  formatAccountingDate,
  formatAccountingMoney,
} from '../utils/accountingWorkspace';

import type { AccountingLedgerRecord } from '../utils/accountingWorkspace';

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

  return (
    <Modal
      destroyOnHidden
      footer={null}
      title={record?.title ?? 'Detalle del asiento'}
      width={760}
      open={open}
      onCancel={onClose}
    >
      {record ? (
        <ModalBody>
          {record.detailMode === 'posted' ? (
            <Alert
              type={canReverse ? 'info' : 'warning'}
              showIcon
              message={
                canReverse
                  ? 'Los asientos posteados no se editan.'
                  : 'Este asiento ya no admite correccion directa.'
              }
              description={
                canReverse
                  ? 'Si necesitas corregirlo, debes crear un asiento de reverso. La correccion ya no se hace editando el asiento original.'
                  : 'El asiento ya esta revertido o no es un asiento posteado. Cualquier ajuste adicional debe registrarse con otro asiento.'
              }
            />
          ) : null}

          <HeaderBlock>
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
            <MetaRow>
              <MetaLabel>Referencia</MetaLabel>
              <MetaValue>{record.reference}</MetaValue>
            </MetaRow>
            {record.internalReference ? (
              <MetaRow>
                <MetaLabel>ID interno</MetaLabel>
                <MetaValue>{record.internalReference}</MetaValue>
              </MetaRow>
            ) : null}
            <MetaRow>
              <MetaLabel>Estado</MetaLabel>
              <MetaValue>{record.statusLabel}</MetaValue>
            </MetaRow>
            <MetaRow>
              <MetaLabel>Modo</MetaLabel>
              <MetaValue>
                {record.detailMode === 'posted'
                  ? 'Asiento posteado'
                  : 'Vista previa del perfil'}
              </MetaValue>
            </MetaRow>
            {record.journalEntry?.reversalOfEntryId ? (
              <MetaRow>
                <MetaLabel>Reversa de</MetaLabel>
                <MetaValue>{record.journalEntry.reversalOfEntryId}</MetaValue>
              </MetaRow>
            ) : null}
          </HeaderBlock>

          <Description>{record.description}</Description>

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
                    <td>
                      <strong>{line.accountCode ?? 'Sin codigo'}</strong>
                      <span>{line.accountName ?? 'Cuenta sin nombre'}</span>
                    </td>
                    <td>{line.description ?? 'Sin detalle adicional'}</td>
                    <td>{line.debit ? formatAccountingMoney(line.debit) : '-'}</td>
                    <td>{line.credit ? formatAccountingMoney(line.credit) : '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={2}>Total</td>
                  <td>
                    {formatAccountingMoney(
                      record.lines.reduce((sum, line) => sum + line.debit, 0),
                    )}
                  </td>
                  <td>
                    {formatAccountingMoney(
                      record.lines.reduce((sum, line) => sum + line.credit, 0),
                    )}
                  </td>
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

const HeaderBlock = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);

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

  td:first-child {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  td:first-child span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }

  tfoot td {
    background: var(--ds-color-bg-subtle);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-primary);
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-3);
`;
