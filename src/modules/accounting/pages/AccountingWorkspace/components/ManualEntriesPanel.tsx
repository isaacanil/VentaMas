import { faCheckCircle, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Alert, Button, Input, InputNumber, Select } from 'antd';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import type { ChartOfAccount } from '@/types/accounting';

import {
  createManualLineId,
  formatAccountingMoney,
  summarizeManualEntryLines,
} from '../utils/accountingWorkspace';

import type { AccountingPeriodClosure } from '../utils/accountingWorkspace';

interface ManualEntriesPanelProps {
  closures: AccountingPeriodClosure[];
  onSubmit: (payload: {
    description: string;
    entryDate: string;
    lines: Array<{
      accountId: string;
      credit: number;
      debit: number;
      description?: string;
    }>;
    note?: string;
  }) => Promise<boolean>;
  postingAccounts: ChartOfAccount[];
  saving: boolean;
}

interface ManualLineState {
  accountId: string;
  credit: number;
  debit: number;
  description: string;
  id: string;
}

const buildInitialLines = (): ManualLineState[] => [
  {
    id: createManualLineId(),
    accountId: '',
    debit: 0,
    credit: 0,
    description: '',
  },
  {
    id: createManualLineId(),
    accountId: '',
    debit: 0,
    credit: 0,
    description: '',
  },
];

export const ManualEntriesPanel = ({
  closures,
  onSubmit,
  postingAccounts,
  saving,
}: ManualEntriesPanelProps) => {
  const [entryDate, setEntryDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<ManualLineState[]>(buildInitialLines);
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(
    () =>
      summarizeManualEntryLines(
        lines.map((line) => ({
          debit: Number(line.debit) || 0,
          credit: Number(line.credit) || 0,
        })),
      ),
    [lines],
  );

  const locked = closures.some(
    (closure) => closure.periodKey === entryDate.slice(0, 7),
  );
  const difference = Math.abs(totals.debit - totals.credit);
  const hasAmounts = totals.debit > 0 || totals.credit > 0;
  const balanced = hasAmounts && difference < 0.005;


  const updateLine = (
    lineId: string,
    field: keyof Omit<ManualLineState, 'id'>,
    value: string | number,
  ) => {
    setLines((current) =>
      current.map((line) =>
        line.id === lineId ? { ...line, [field]: value } : line,
      ),
    );
  };

  const removeLine = (lineId: string) => {
    setLines((current) =>
      current.length <= 2
        ? current
        : current.filter((line) => line.id !== lineId),
    );
  };

  const addLine = () =>
    setLines((current) => [
      ...current,
      { id: createManualLineId(), accountId: '', debit: 0, credit: 0, description: '' },
    ]);

  const handleSubmit = async () => {
    setError(null);

    if (!description.trim()) {
      setError('Agrega una descripcion del asiento.');
      return;
    }

    if (locked) {
      setError(
        'No puedes guardar este asiento con la fecha seleccionada porque ese periodo esta cerrado. Usa otra fecha o solicita reabrir el periodo.',
      );
      return;
    }

    if (!balanced) {
      setError('El asiento debe cuadrar antes de guardarse.');
      return;
    }

    const wasSaved = await onSubmit({
      description,
      entryDate,
      lines: lines.map((line) => ({
        accountId: line.accountId,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
        description: line.description.trim() || undefined,
      })),
      note: note.trim() || undefined,
    });

    if (wasSaved) {
      setDescription('');
      setNote('');
      setLines(buildInitialLines());
    }
  };

  return (
    <Panel>
      {locked ? (
        <Alert
          message="La fecha seleccionada pertenece a un periodo cerrado."
          description="Usa otra fecha o solicita reabrir el periodo para registrar este asiento."
          type="warning"
          showIcon
        />
      ) : null}

      {error ? <Alert message={error} type="error" showIcon /> : null}

      <HeaderCard>
        <FormGrid>
          <Field $compact>
            <FieldLabel>Fecha del asiento</FieldLabel>
            <Input
              type="date"
              value={entryDate}
              onChange={(event) => setEntryDate(event.target.value)}
            />
          </Field>

          <Field>
            <FieldLabel>Descripcion</FieldLabel>
            <Input
              type="text"
              placeholder="Ej. Reclasificacion de gastos anticipados"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <Field $full>
            <FieldLabel>Nota o referencia</FieldLabel>
            <Input
              type="text"
              placeholder="Soporte, observacion o referencia externa"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </Field>
        </FormGrid>
      </HeaderCard>

      <LinesShell>
        <LinesTable>
          <thead>
            <tr>
              <th>Cuenta</th>
              <th>Descripcion de linea</th>
              <th>Debito</th>
              <th>Credito</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => {
              const isLastLine = index === lines.length - 1;
              return (
                <tr key={line.id}>
                  <td>
                    <Select
                      style={{ width: '100%' }}
                      value={line.accountId || undefined}
                      placeholder="Selecciona una cuenta"
                      options={postingAccounts.map((account) => ({
                        label: `${account.code} · ${account.name}`,
                        value: account.id,
                      }))}
                      onChange={(value) =>
                        updateLine(line.id, 'accountId', value)
                      }
                    />
                  </td>
                  <td>
                    <Input
                      value={line.description}
                      onChange={(event) =>
                        updateLine(line.id, 'description', event.target.value)
                      }
                      placeholder="Detalle opcional"
                    />
                  </td>
                  <td>
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      value={line.debit || 0}
                      onChange={(value) =>
                        updateLine(line.id, 'debit', Number(value) || 0)
                      }
                    />
                  </td>
                  <td>
                    <InputNumber
                      min={0}
                      step={0.01}
                      style={{ width: '100%' }}
                      value={line.credit || 0}
                      onChange={(value) =>
                        updateLine(line.id, 'credit', Number(value) || 0)
                      }
                      onKeyDown={(e) => {
                        if (
                          isLastLine &&
                          (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey))
                        ) {
                          e.preventDefault();
                          addLine();
                        }
                      }}
                    />
                  </td>
                  <td>
                    <Button
                      aria-label="Quitar linea"
                      danger
                      disabled={lines.length <= 2}
                      icon={<FontAwesomeIcon icon={faTrash} />}
                      size="small"
                      title="Quitar linea"
                      type="text"
                      onClick={() => removeLine(line.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <TotalsRow>
              <td colSpan={2}>
                <TfootLabel>Totales</TfootLabel>
              </td>
              <TotalsNumCell $error={hasAmounts && !balanced}>
                {formatAccountingMoney(totals.debit)}
              </TotalsNumCell>
              <TotalsNumCell $error={hasAmounts && !balanced}>
                {formatAccountingMoney(totals.credit)}
              </TotalsNumCell>
              <TotalsBalanceCell $balanced={balanced} $active={hasAmounts}>
                {balanced ? (
                  <>
                    <FontAwesomeIcon icon={faCheckCircle} />
                    <span>Cuadra</span>
                  </>
                ) : hasAmounts ? (
                  <span>Δ {formatAccountingMoney(difference)}</span>
                ) : (
                  <span>—</span>
                )}
              </TotalsBalanceCell>
            </TotalsRow>
          </tfoot>
        </LinesTable>
      </LinesShell>

      <ActionRow>
        <Button onClick={addLine}>Agregar linea</Button>
        <ActionRight>
          {hasAmounts && !balanced ? (
            <DiffHint>
              Diferencia de {formatAccountingMoney(difference)} — el asiento debe cuadrar para guardar
            </DiffHint>
          ) : null}
          <Button
            type="primary"
            loading={saving}
            disabled={!balanced || locked}
            onClick={() => void handleSubmit()}
          >
            Guardar asiento
          </Button>
        </ActionRight>
      </ActionRow>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const HeaderCard = styled.div`
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label<{ $compact?: boolean; $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  grid-column: ${(props) => (props.$full ? '1 / -1' : 'auto')};
  max-width: ${(props) => (props.$compact ? '220px' : 'none')};

  @media (max-width: 860px) {
    max-width: none;
  }
`;

const FieldLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  color: var(--ds-color-text-secondary);
`;

const LinesShell = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const LinesTable = styled.table`
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;

  th,
  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: top;
  }

  th {
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    border-bottom: 1px solid var(--ds-color-border-default);
  }

  th:first-child,
  td:first-child {
    min-width: 280px;
  }

  th:nth-child(3),
  td:nth-child(3),
  th:nth-child(4),
  td:nth-child(4) {
    width: 140px;
    min-width: 140px;
  }

  th:last-child,
  td:last-child {
    width: 56px;
    min-width: 56px;
    text-align: center;
  }
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--ds-space-3);

  @media (max-width: 640px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const ActionRight = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
`;

const DiffHint = styled.span`
  font-size: var(--ds-font-size-sm);
  color: var(--ds-color-state-danger-text);
  font-weight: var(--ds-font-weight-medium);
`;

const TotalsRow = styled.tr`
  background: var(--ds-color-bg-subtle);

  td {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-top: 1px solid var(--ds-color-border-default);
  }
`;

const TfootLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
  color: var(--ds-color-text-secondary);
`;

const TotalsNumCell = styled.td<{ $error?: boolean }>`
  font-variant-numeric: tabular-nums;
  font-weight: var(--ds-font-weight-semibold);
  font-size: var(--ds-font-size-base);
  color: ${({ $error }) =>
    $error
      ? 'var(--ds-color-state-danger-text)'
      : 'var(--ds-color-text-primary)'};
  white-space: nowrap;
`;

const TotalsBalanceCell = styled.td<{ $balanced: boolean; $active: boolean }>`
  text-align: center;
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  white-space: nowrap;
  color: ${({ $balanced, $active }) =>
    !$active
      ? 'var(--ds-color-text-disabled)'
      : $balanced
        ? 'var(--ds-color-text-secondary)'
        : 'var(--ds-color-state-danger-text)'};

  svg {
    margin-right: 4px;
  }
`;
