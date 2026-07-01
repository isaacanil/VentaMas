import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parseDate } from '@internationalized/date';
import type { FormEvent, Key } from 'react';
import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';

import { PlusOutlined, SaveOutlined } from '@/constants/icons/antd';
import {
  VmAlert,
  VmButton,
  VmDateField,
  VmInput,
  VmListBox,
  VmNumberField,
  VmSelect,
  VmTextArea,
} from '@/components/heroui';
import type { ChartOfAccount } from '@/types/accounting';

import {
  createManualLineId,
  formatAccountingMoney,
  summarizeManualEntryLines,
} from '../../utils/accountingWorkspace';

import type {
  AccountingLedgerRecord,
  AccountingPeriodClosure,
} from '../../utils/accountingWorkspace';

interface JournalEntryEditFormProps {
  closures: AccountingPeriodClosure[];
  formId?: string;
  modalFooterElement?: HTMLElement | null;
  onCancel: () => void;
  onSubmit: (payload: {
    description: string;
    entryDate: string;
    entryId: string;
    lines: Array<{
      accountId: string;
      credit: number;
      debit: number;
      description?: string;
    }>;
    reason: string;
  }) => Promise<boolean>;
  postingAccounts: ChartOfAccount[];
  record: AccountingLedgerRecord;
  saving: boolean;
  useModalFooter?: boolean;
}

interface EditLineState {
  accountId: string;
  credit: number;
  debit: number;
  description: string;
  id: string;
}

const toDateInputValue = (value: Date | null): string =>
  value instanceof Date && !Number.isNaN(value.getTime())
    ? value.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

const toComparableMoney = (value: number): number =>
  Math.round((Number(value) || 0) * 100) / 100;

const buildInitialLines = (record: AccountingLedgerRecord): EditLineState[] => {
  const sourceLines = record.lines.length
    ? record.lines
    : [
        { accountId: '', debit: 0, credit: 0, description: null },
        { accountId: '', debit: 0, credit: 0, description: null },
      ];

  return sourceLines.map((line) => ({
    id: createManualLineId(),
    accountId: line.accountId,
    debit: Number(line.debit) || 0,
    credit: Number(line.credit) || 0,
    description: line.description ?? '',
  }));
};

const serializeComparableLines = (lines: EditLineState[]): string =>
  JSON.stringify(
    lines
      .filter(
        (line) =>
          line.accountId &&
          ((line.debit > 0 && line.credit === 0) ||
            (line.credit > 0 && line.debit === 0)),
      )
      .map((line) => ({
        accountId: line.accountId,
        credit: toComparableMoney(line.credit),
        debit: toComparableMoney(line.debit),
        description: line.description.trim(),
      })),
  );

export const JournalEntryEditForm = ({
  closures,
  formId = 'journal-entry-edit-form',
  modalFooterElement = null,
  onCancel,
  onSubmit,
  postingAccounts,
  record,
  saving,
  useModalFooter = false,
}: JournalEntryEditFormProps) => {
  const entryId = record.journalEntry?.id ?? '';
  const [entryDate, setEntryDate] = useState(() =>
    toDateInputValue(record.entryDate),
  );
  const [description, setDescription] = useState(record.description);
  const [reason, setReason] = useState('');
  const [lines, setLines] = useState<EditLineState[]>(() =>
    buildInitialLines(record),
  );
  const [error, setError] = useState<string | null>(null);
  const entryDateValue = useMemo(() => parseDate(entryDate), [entryDate]);
  const [initialSnapshot] = useState(() => ({
    description: record.description.trim(),
    entryDate: toDateInputValue(record.entryDate),
    lines: serializeComparableLines(buildInitialLines(record)),
  }));

  const accountOptions = useMemo(() => {
    const optionsById = new Map<string, { id: string; label: string }>();

    postingAccounts.forEach((account) => {
      optionsById.set(account.id, {
        id: account.id,
        label: `${account.code} - ${account.name}`,
      });
    });
    record.lines.forEach((line) => {
      if (!line.accountId || optionsById.has(line.accountId)) return;
      optionsById.set(line.accountId, {
        id: line.accountId,
        label: `${line.accountCode ?? 'Sin codigo'} - ${
          line.accountName ?? 'Cuenta actual'
        }`,
      });
    });

    return Array.from(optionsById.values()).sort((left, right) =>
      left.label.localeCompare(right.label),
    );
  }, [postingAccounts, record.lines]);

  const normalizedLines = useMemo(
    () =>
      lines.map((line) => ({
        ...line,
        debit: Number(line.debit) || 0,
        credit: Number(line.credit) || 0,
      })),
    [lines],
  );
  const validLines = normalizedLines.filter(
    (line) =>
      line.accountId &&
      ((line.debit > 0 && line.credit === 0) ||
        (line.credit > 0 && line.debit === 0)),
  );
  const totals = useMemo(
    () =>
      summarizeManualEntryLines(
        normalizedLines.map((line) => ({
          debit: line.debit,
          credit: line.credit,
        })),
      ),
    [normalizedLines],
  );
  const targetPeriodLocked = closures.some(
    (closure) => closure.periodKey === entryDate.slice(0, 7),
  );
  const originalPeriodLocked = closures.some(
    (closure) => record.periodKey && closure.periodKey === record.periodKey,
  );
  const locked = targetPeriodLocked || originalPeriodLocked;
  const difference = Math.abs(totals.debit - totals.credit);
  const hasAmounts = totals.debit > 0 || totals.credit > 0;
  const balanced = hasAmounts && difference < 0.005;
  const hasInvalidAmountLine = normalizedLines.some(
    (line) => line.debit > 0 && line.credit > 0,
  );
  const hasCorrectionChanges =
    entryDate !== initialSnapshot.entryDate ||
    description.trim() !== initialSnapshot.description ||
    serializeComparableLines(normalizedLines) !== initialSnapshot.lines;
  const canSave =
    Boolean(entryId) &&
    Boolean(description.trim()) &&
    Boolean(reason.trim()) &&
    hasCorrectionChanges &&
    !locked &&
    !hasInvalidAmountLine &&
    balanced &&
    validLines.length >= 2 &&
    !saving;

  const updateLine = (
    lineId: string,
    field: keyof Omit<EditLineState, 'id'>,
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

  const addLine = () => {
    setLines((current) => [
      ...current,
      {
        id: createManualLineId(),
        accountId: '',
        debit: 0,
        credit: 0,
        description: '',
      },
    ]);
  };

  const handleLineAccountChange = (lineId: string, key: Key | null) => {
    updateLine(lineId, 'accountId', key ? String(key) : '');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!description.trim()) {
      setError('Agrega una descripcion del asiento.');
      return;
    }
    if (!reason.trim()) {
      setError('Agrega el motivo de la correccion.');
      return;
    }
    if (!hasCorrectionChanges) {
      setError('Realiza al menos un cambio antes de registrar la correccion.');
      return;
    }
    if (locked) {
      setError(
        'No puedes corregir asientos de periodos cerrados ni moverlos hacia un periodo cerrado.',
      );
      return;
    }
    if (hasInvalidAmountLine) {
      setError('Cada linea debe tener debito o credito, no ambos.');
      return;
    }
    if (!balanced) {
      setError('El asiento debe cuadrar antes de guardarse.');
      return;
    }
    if (validLines.length < 2) {
      setError('El asiento requiere al menos dos lineas validas.');
      return;
    }

    const wasSaved = await onSubmit({
      description,
      entryDate,
      entryId,
      lines: validLines.map((line) => ({
        accountId: line.accountId,
        debit: line.debit,
        credit: line.credit,
        description: line.description.trim() || undefined,
      })),
      reason,
    });

    if (wasSaved) {
      onCancel();
    }
  };

  const footerContent = (
    <EditorFooter>
      <BalanceStatus $balanced={balanced} $active={hasAmounts}>
        {balanced
          ? `Cuadrado: RD$ ${formatAccountingMoney(totals.debit)}`
          : hasAmounts
            ? `Diferencia RD$ ${formatAccountingMoney(difference)}`
            : 'Sin montos'}
      </BalanceStatus>
      <FooterActions>
        <VmButton type="button" variant="secondary" onPress={onCancel}>
          Cancelar
        </VmButton>
        <VmButton
          form={formId}
          isDisabled={!canSave}
          isPending={saving}
          type="submit"
          variant="primary"
        >
          <SaveOutlined />
          Guardar correccion
        </VmButton>
      </FooterActions>
    </EditorFooter>
  );
  const modalFooter = modalFooterElement
    ? createPortal(footerContent, modalFooterElement)
    : null;

  return (
    <>
      <EditorForm id={formId} method="POST" onSubmit={handleSubmit}>
        {error ? (
          <VmAlert status="danger">
            <VmAlert.Indicator />
            <VmAlert.Content>
              <VmAlert.Title>{error}</VmAlert.Title>
            </VmAlert.Content>
          </VmAlert>
        ) : null}

        <CorrectionPolicyAlert status="warning">
          <VmAlert.Indicator />
          <VmAlert.Content>
            <VmAlert.Title>Correccion contable avanzada</VmAlert.Title>
            <VmAlert.Description>
              Usa este flujo solo cuando el documento origen no pueda
              corregirse. El cambio quedara auditado y no aplica en periodos
              cerrados.
            </VmAlert.Description>
          </VmAlert.Content>
        </CorrectionPolicyAlert>

        <FormGrid>
          <Field $compact>
            <FieldLabel>Fecha</FieldLabel>
            <VmDateField
              aria-label="Fecha del asiento"
              value={entryDateValue}
              onChange={(value) => {
                if (value) setEntryDate(value.toString());
              }}
            >
              <VmDateField.Group fullWidth>
                <VmDateField.Input>
                  {(segment) => <VmDateField.Segment segment={segment} />}
                </VmDateField.Input>
              </VmDateField.Group>
            </VmDateField>
          </Field>

          <Field>
            <FieldLabel>Concepto</FieldLabel>
            <VmInput
              fullWidth
              aria-label="Concepto del asiento"
              name="description"
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <Field $full>
            <FieldLabel>Motivo de la correccion</FieldLabel>
            <VmTextArea
              aria-label="Motivo de la correccion"
              name="reason"
              placeholder="Explica por que no se corrige desde el documento origen."
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
        </FormGrid>

        <LinesToolbar>
          <LinesToolbarTitle>Lineas corregidas</LinesToolbarTitle>
          <VmButton type="button" variant="tertiary" onPress={addLine}>
            <PlusOutlined />
            Agregar linea
          </VmButton>
        </LinesToolbar>

        <LinesShell>
          <LinesTable>
            <thead>
              <tr>
                <th>#</th>
                <th>Cuenta</th>
                <th>Detalle</th>
                <th>Debito</th>
                <th>Credito</th>
                <th aria-label="Acciones" />
              </tr>
            </thead>
            <tbody>
              {lines.map((line, index) => (
                <tr key={line.id}>
                  <td>{index + 1}</td>
                  <td>
                    <VmSelect
                      fullWidth
                      aria-label={`Cuenta linea ${index + 1}`}
                      placeholder="Seleccionar cuenta"
                      selectedKey={line.accountId || null}
                      onSelectionChange={(key) =>
                        handleLineAccountChange(line.id, key)
                      }
                    >
                      <VmSelect.Trigger>
                        <VmSelect.Value />
                        <VmSelect.Indicator />
                      </VmSelect.Trigger>
                      <VmSelect.Popover>
                        <VmListBox>
                          {accountOptions.map((account) => (
                            <VmListBox.Item
                              key={account.id}
                              id={account.id}
                              textValue={account.label}
                            >
                              {account.label}
                              <VmListBox.ItemIndicator />
                            </VmListBox.Item>
                          ))}
                        </VmListBox>
                      </VmSelect.Popover>
                    </VmSelect>
                  </td>
                  <td>
                    <VmInput
                      fullWidth
                      aria-label={`Descripcion linea ${index + 1}`}
                      name={`line-${index + 1}-description`}
                      value={line.description}
                      onChange={(event) =>
                        updateLine(line.id, 'description', event.target.value)
                      }
                    />
                  </td>
                  <td>
                    <AmountNumberField
                      fullWidth
                      aria-label={`Debito linea ${index + 1}`}
                      minValue={0}
                      name={`line-${index + 1}-debit`}
                      step={0.01}
                      value={line.debit || 0}
                      onChange={(value) =>
                        updateLine(line.id, 'debit', Number(value) || 0)
                      }
                    >
                      <VmNumberField.Group>
                        <VmNumberField.Input />
                      </VmNumberField.Group>
                    </AmountNumberField>
                  </td>
                  <td>
                    <AmountNumberField
                      fullWidth
                      aria-label={`Credito linea ${index + 1}`}
                      minValue={0}
                      name={`line-${index + 1}-credit`}
                      step={0.01}
                      value={line.credit || 0}
                      onChange={(value) =>
                        updateLine(line.id, 'credit', Number(value) || 0)
                      }
                    >
                      <VmNumberField.Group>
                        <VmNumberField.Input />
                      </VmNumberField.Group>
                    </AmountNumberField>
                  </td>
                  <td>
                    <VmButton
                      aria-label="Quitar linea"
                      isDisabled={lines.length <= 2}
                      isIconOnly
                      size="sm"
                      type="button"
                      variant="danger-soft"
                      onPress={() => removeLine(line.id)}
                    >
                      <FontAwesomeIcon icon={faTrash} />
                    </VmButton>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3}>Totales</td>
                <AmountCell $error={hasAmounts && !balanced} $tone="debit">
                  {formatAccountingMoney(totals.debit)}
                </AmountCell>
                <AmountCell $error={hasAmounts && !balanced} $tone="credit">
                  {formatAccountingMoney(totals.credit)}
                </AmountCell>
                <td />
              </tr>
            </tfoot>
          </LinesTable>
        </LinesShell>
      </EditorForm>
      {modalFooter ?? (useModalFooter ? null : footerContent)}
    </>
  );
};

const EditorForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const CorrectionPolicyAlert = styled(VmAlert)`
  align-items: flex-start;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(140px, 160px) minmax(260px, 1fr);
  gap: var(--ds-space-3);
  align-items: end;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label<{ $compact?: boolean; $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  grid-column: ${({ $full }) => ($full ? '1 / -1' : 'auto')};
  max-width: ${({ $compact }) => ($compact ? '170px' : 'none')};

  @media (max-width: 640px) {
    max-width: none;
  }
`;

const FieldLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  line-height: var(--ds-line-height-tight);
  text-transform: uppercase;
`;

const LinesToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
`;

const LinesToolbarTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const LinesShell = styled.div`
  container: journal-entry-lines / inline-size;
  overflow-x: clip;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
`;

const LinesTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  th,
  td {
    padding: var(--ds-space-2);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: middle;
  }

  th {
    background: var(--ds-color-bg-subtle);
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
  }

  th:first-child,
  td:first-child {
    width: 40px;
    text-align: center;
  }

  th:nth-child(2),
  td:nth-child(2) {
    width: 32%;
  }

  th:nth-child(3),
  td:nth-child(3) {
    width: 28%;
  }

  th:nth-child(4),
  td:nth-child(4),
  th:nth-child(5),
  td:nth-child(5) {
    width: 118px;
  }

  th:last-child,
  td:last-child {
    width: 52px;
    text-align: center;
  }

  td > * {
    min-width: 0;
  }

  [role='button'],
  input,
  select,
  textarea {
    max-width: 100%;
  }

  tfoot td {
    background: var(--ds-color-bg-subtle);
    border-bottom: 0;
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-semibold);
  }

  @container journal-entry-lines (max-width: 760px) {
    th,
    td {
      padding: var(--ds-space-2) var(--ds-space-1);
    }

    th:first-child,
    td:first-child {
      width: 32px;
    }

    th:nth-child(2),
    td:nth-child(2) {
      width: 30%;
    }

    th:nth-child(3),
    td:nth-child(3) {
      width: 26%;
    }

    th:nth-child(4),
    td:nth-child(4),
    th:nth-child(5),
    td:nth-child(5) {
      width: 96px;
    }

    th:last-child,
    td:last-child {
      width: 40px;
    }
  }
`;

const AmountNumberField = styled(VmNumberField)`
  width: 100%;

  .number-field__input {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

const AmountCell = styled.td<{
  $error?: boolean;
  $tone: 'debit' | 'credit';
}>`
  && {
    text-align: right;
  }

  color: ${({ $error, $tone }) =>
    $error
      ? 'var(--ds-color-state-danger-text)'
      : $tone === 'debit'
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-state-danger-text)'};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

const EditorFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  flex-wrap: wrap;
`;

const BalanceStatus = styled.span<{ $active: boolean; $balanced: boolean }>`
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 0 var(--ds-space-3);
  border: 1px solid
    ${({ $active, $balanced }) =>
      !$active
        ? 'var(--ds-color-border-default)'
        : $balanced
          ? 'var(--ds-color-state-success)'
          : 'var(--ds-color-state-danger)'};
  border-radius: var(--ds-radius-md);
  background: ${({ $active, $balanced }) =>
    !$active
      ? 'var(--ds-color-bg-subtle)'
      : $balanced
        ? 'var(--ds-color-state-success-subtle)'
        : 'var(--ds-color-state-danger-subtle)'};
  color: ${({ $active, $balanced }) =>
    !$active
      ? 'var(--ds-color-text-secondary)'
      : $balanced
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-state-danger-text)'};
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1;
`;

const FooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  flex-wrap: wrap;

  @media (max-width: 560px) {
    width: 100%;

    > * {
      flex: 1 1 100%;
    }
  }
`;
