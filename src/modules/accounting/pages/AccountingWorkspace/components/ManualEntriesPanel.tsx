import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { parseDate } from '@internationalized/date';
import { message } from 'antd';
import type { Key } from 'react';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import {
  CheckCircleOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@/constants/icons/antd';
import {
  VmAlert,
  VmButton,
  VmCard,
  VmDateField,
  VmInput,
  VmListBox,
  VmNumberField,
  VmSelect,
  VmSurface,
  VmTable,
} from '@/components/heroui';
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

const ENTRY_TYPE_OPTIONS = [
  { label: 'Ajuste', value: 'adjustment' },
  { label: 'Reclasificacion', value: 'reclassification' },
  { label: 'Provision', value: 'accrual' },
  { label: 'Cierre', value: 'closing' },
] as const;

const RECENT_TEMPLATES = [
  'Alquiler mensual',
  'Depreciacion activos fijos',
  'Provision regalia pascual',
  'Cierre ITBIS mensual',
] as const;

type EntryType = (typeof ENTRY_TYPE_OPTIONS)[number]['value'];

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
  const [entryDate, setEntryDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [entryType, setEntryType] = useState<EntryType>('adjustment');
  const [description, setDescription] = useState('');
  const [note, setNote] = useState('');
  const [lines, setLines] = useState<ManualLineState[]>(buildInitialLines);
  const [error, setError] = useState<string | null>(null);
  const entryDateValue = useMemo(() => parseDate(entryDate), [entryDate]);

  const accountOptions = useMemo(
    () =>
      postingAccounts.map((account) => ({
        id: account.id,
        label: `${account.code} — ${account.name}`,
      })),
    [postingAccounts],
  );

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
  const validLinesCount = lines.filter(
    (line) =>
      line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0),
  ).length;
  const validLines = lines.filter(
    (line) =>
      line.accountId && (Number(line.debit) > 0 || Number(line.credit) > 0),
  );
  const everyValidLineHasDescription = validLines.every((line) =>
    line.description.trim(),
  );
  const hasConcept = Boolean(description.trim());
  const canSave =
    balanced &&
    !locked &&
    validLinesCount >= 2 &&
    everyValidLineHasDescription &&
    hasConcept &&
    !saving;
  const resetDraft = () => {
    setEntryDate(new Date().toISOString().slice(0, 10));
    setEntryType('adjustment');
    setDescription('');
    setNote('');
    setLines(buildInitialLines());
    setError(null);
  };

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
      {
        id: createManualLineId(),
        accountId: '',
        debit: 0,
        credit: 0,
        description: '',
      },
    ]);

  const handleEntryTypeChange = (key: Key | null) => {
    if (!key) return;
    setEntryType(String(key) as EntryType);
  };

  const handleLineAccountChange = (lineId: string, key: Key | null) => {
    updateLine(lineId, 'accountId', key ? String(key) : '');
  };

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
      <HeaderBar>
        <HeaderCopy>
          <HeaderTitle>Nuevo asiento manual</HeaderTitle>
          <HeaderMeta>Borrador · sin contabilizar</HeaderMeta>
        </HeaderCopy>
        <HeaderActions>
          <VmButton variant="tertiary" onPress={resetDraft}>
            Descartar
          </VmButton>
          <VmButton
            variant="secondary"
            onPress={() =>
              void message.info('Borrador local aun no disponible.')
            }
          >
            Guardar borrador
          </VmButton>
          <VmButton
            variant="primary"
            isPending={saving}
            isDisabled={!canSave}
            onPress={() => void handleSubmit()}
          >
            <SaveOutlined />
            Contabilizar asiento
          </VmButton>
        </HeaderActions>
      </HeaderBar>

      {error ? (
        <VmAlert status="danger">
          <VmAlert.Indicator />
          <VmAlert.Content>
            <VmAlert.Title>{error}</VmAlert.Title>
          </VmAlert.Content>
        </VmAlert>
      ) : null}

      <EditorLayout>
        <MainSurface>
          <MainSurfaceContent>
            <CardHeader>
              <SectionTitle>
                Asiento <span>{validLinesCount} lineas</span>
              </SectionTitle>
              <VmButton variant="tertiary">Desde plantilla</VmButton>
            </CardHeader>

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
                <FieldLabel>Concepto / memo</FieldLabel>
                <VmInput
                  fullWidth
                  aria-label="Concepto o memo del asiento"
                  type="text"
                  placeholder="Descripcion general del asiento"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>

              <Field $compact>
                <FieldLabel>Tipo</FieldLabel>
                <VmSelect
                  fullWidth
                  aria-label="Tipo de asiento"
                  selectedKey={entryType}
                  onSelectionChange={handleEntryTypeChange}
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value />
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <VmListBox>
                      {ENTRY_TYPE_OPTIONS.map((option) => (
                        <VmListBox.Item
                          key={option.value}
                          id={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                          <VmListBox.ItemIndicator />
                        </VmListBox.Item>
                      ))}
                    </VmListBox>
                  </VmSelect.Popover>
                </VmSelect>
              </Field>

              <Field $compact>
                <FieldLabel>Ref. externa</FieldLabel>
                <VmInput
                  fullWidth
                  aria-label="Referencia externa"
                  type="text"
                  placeholder="ej. NC-023"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </Field>
            </FormGrid>

            <LinesShell>
              <LinesTable>
                <VmTable.ScrollContainer>
                  <ManualLinesContent aria-label="Lineas del asiento manual">
                    <ManualLinesHeader>
                      <VmTable.Column isRowHeader>#</VmTable.Column>
                      <VmTable.Column>Cuenta</VmTable.Column>
                      <VmTable.Column>Descripcion</VmTable.Column>
                      <VmTable.Column>Debito</VmTable.Column>
                      <VmTable.Column>Credito</VmTable.Column>
                      <VmTable.Column aria-label="Acciones" />
                    </ManualLinesHeader>
                    <VmTable.Body>
                      {lines.map((line, index) => {
                        const isLastLine = index === lines.length - 1;
                        return (
                          <VmTable.Row key={line.id} id={line.id}>
                            <VmTable.Cell>{index + 1}</VmTable.Cell>
                            <VmTable.Cell>
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
                            </VmTable.Cell>
                            <VmTable.Cell>
                              <VmInput
                                fullWidth
                                aria-label={`Descripcion linea ${index + 1}`}
                                value={line.description}
                                onChange={(event) =>
                                  updateLine(
                                    line.id,
                                    'description',
                                    event.target.value,
                                  )
                                }
                                placeholder="Descripcion de la linea"
                              />
                            </VmTable.Cell>
                            <VmTable.Cell>
                              <AmountNumberField
                                fullWidth
                                aria-label={`Debito linea ${index + 1}`}
                                minValue={0}
                                step={0.01}
                                value={line.debit || 0}
                                onChange={(value) =>
                                  updateLine(
                                    line.id,
                                    'debit',
                                    Number(value) || 0,
                                  )
                                }
                              >
                                <VmNumberField.Group>
                                  <VmNumberField.Input />
                                </VmNumberField.Group>
                              </AmountNumberField>
                            </VmTable.Cell>
                            <VmTable.Cell>
                              <AmountNumberField
                                fullWidth
                                aria-label={`Credito linea ${index + 1}`}
                                minValue={0}
                                step={0.01}
                                value={line.credit || 0}
                                onChange={(value) =>
                                  updateLine(
                                    line.id,
                                    'credit',
                                    Number(value) || 0,
                                  )
                                }
                              >
                                <VmNumberField.Group>
                                  <VmNumberField.Input
                                    onKeyDown={(e) => {
                                      if (
                                        isLastLine &&
                                        (e.key === 'Enter' ||
                                          (e.key === 'Tab' && !e.shiftKey))
                                      ) {
                                        e.preventDefault();
                                        addLine();
                                      }
                                    }}
                                  />
                                </VmNumberField.Group>
                              </AmountNumberField>
                            </VmTable.Cell>
                            <VmTable.Cell>
                              <VmButton
                                aria-label="Quitar linea"
                                isIconOnly
                                isDisabled={lines.length <= 2}
                                size="sm"
                                variant="danger-soft"
                                onPress={() => removeLine(line.id)}
                              >
                                <FontAwesomeIcon icon={faTrash} />
                              </VmButton>
                            </VmTable.Cell>
                          </VmTable.Row>
                        );
                      })}
                      <TotalsRow id="manual-entry-totals">
                        <VmTable.Cell colSpan={3}>
                          <TfootLabel>Totales · RD$</TfootLabel>
                        </VmTable.Cell>
                        <TotalsNumCell
                          $tone="debit"
                          $error={hasAmounts && !balanced}
                        >
                          {formatAccountingMoney(totals.debit)}
                        </TotalsNumCell>
                        <TotalsNumCell
                          $tone="credit"
                          $error={hasAmounts && !balanced}
                        >
                          {formatAccountingMoney(totals.credit)}
                        </TotalsNumCell>
                        <VmTable.Cell />
                      </TotalsRow>
                    </VmTable.Body>
                  </ManualLinesContent>
                </VmTable.ScrollContainer>
              </LinesTable>
            </LinesShell>

            <AddLineButton variant="tertiary" onPress={addLine}>
              <PlusOutlined />
              Agregar linea
            </AddLineButton>

            {hasAmounts ? (
              <BalanceBanner $balanced={balanced}>
                {balanced ? (
                  <>
                    <CheckCircleOutlined />
                    <strong>Asiento cuadrado.</strong>
                    <span>
                      Debitos = Creditos = RD${' '}
                      {formatAccountingMoney(totals.debit)}. Listo para
                      contabilizar.
                    </span>
                  </>
                ) : (
                  <span>
                    Diferencia RD$ {formatAccountingMoney(difference)}. Debitos
                    y creditos deben cuadrar.
                  </span>
                )}
              </BalanceBanner>
            ) : null}
          </MainSurfaceContent>
        </MainSurface>

        <SupportGrid>
          <SideCard>
            <SideTitle>Resumen</SideTitle>
            <SummaryRows>
              <SummaryRow>
                <span>Lineas</span>
                <strong>{validLinesCount}</strong>
              </SummaryRow>
              <SummaryRow $tone="debit">
                <span>Σ Debito</span>
                <strong>RD$ {formatAccountingMoney(totals.debit)}</strong>
              </SummaryRow>
              <SummaryRow $tone="credit">
                <span>Σ Credito</span>
                <strong>RD$ {formatAccountingMoney(totals.credit)}</strong>
              </SummaryRow>
              <SummaryRow $tone={balanced ? 'debit' : 'credit'}>
                <span>Diferencia</span>
                <strong>RD$ {formatAccountingMoney(difference)}</strong>
              </SummaryRow>
              <SummaryRow>
                <span>Estado</span>
                <StatusPill $balanced={balanced} $active={hasAmounts}>
                  {balanced ? 'Listo' : hasAmounts ? 'Revisar' : 'Borrador'}
                </StatusPill>
              </SummaryRow>
            </SummaryRows>
          </SideCard>

          <SideCard>
            <SideTitle>Validaciones</SideTitle>
            <ValidationList>
              <ValidationItem $ok={balanced}>
                <CheckCircleOutlined />
                <span>Debitos = Creditos</span>
              </ValidationItem>
              <ValidationItem $ok={!locked}>
                <CheckCircleOutlined />
                <span>Fecha dentro del periodo abierto</span>
              </ValidationItem>
              <ValidationItem $ok={validLinesCount >= 2}>
                <CheckCircleOutlined />
                <span>Al menos 2 lineas con cuenta</span>
              </ValidationItem>
              <ValidationItem $ok={everyValidLineHasDescription}>
                <CheckCircleOutlined />
                <span>Cada linea tiene descripcion</span>
              </ValidationItem>
              <ValidationItem $ok={hasConcept}>
                <CheckCircleOutlined />
                <span>Concepto general completado</span>
              </ValidationItem>
            </ValidationList>
          </SideCard>

          <SideCard>
            <SideTitle>Plantillas recientes</SideTitle>
            <TemplateList>
              {RECENT_TEMPLATES.map((template) => (
                <TemplateButton
                  key={template}
                  fullWidth
                  variant="tertiary"
                  onPress={() =>
                    void message.info(
                      'Plantillas contables aun no disponibles.',
                    )
                  }
                >
                  <span>{template}</span>
                  <span>›</span>
                </TemplateButton>
              ))}
            </TemplateList>
          </SideCard>
        </SupportGrid>
      </EditorLayout>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const HeaderBar = styled.section`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);
  flex-wrap: wrap;
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: clamp(1.25rem, 1.4vw, 1.5rem);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;

const HeaderMeta = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  flex-wrap: wrap;
`;

const EditorLayout = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const MainSurface = styled(VmSurface)`
  border-radius: calc(var(--radius) * 3);
`;

const MainSurfaceContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-3);
  padding: var(--ds-space-4);
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: 0;
`;

const StatusPill = styled.div<{ $balanced: boolean; $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  min-height: 26px;
  margin-top: var(--ds-space-1);
  padding: 0 var(--ds-space-2);
  border: 1px solid
    ${({ $balanced, $active }) =>
      !$active
        ? 'var(--ds-color-border-default)'
        : $balanced
          ? 'var(--ds-color-state-success)'
          : 'var(--ds-color-state-danger)'};
  border-radius: var(--ds-radius-md);
  background: ${({ $balanced, $active }) =>
    !$active
      ? 'var(--ds-color-bg-subtle)'
      : $balanced
        ? 'var(--ds-color-state-success-subtle)'
        : 'var(--ds-color-state-danger-subtle)'};
  color: ${({ $balanced, $active }) =>
    !$active
      ? 'var(--ds-color-text-secondary)'
      : $balanced
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-state-danger-text)'};
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  line-height: 1;

  span {
    color: currentColor;
    letter-spacing: var(--ds-letter-spacing-normal);
    text-transform: none;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns:
    minmax(140px, 150px) minmax(260px, 1fr) minmax(130px, 150px)
    minmax(150px, 170px);
  gap: var(--ds-space-3);
  align-items: end;
  padding: var(--ds-space-2) 0;

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const Field = styled.label<{ $compact?: boolean; $full?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  grid-column: ${(props) => (props.$full ? '1 / -1' : 'auto')};
  max-width: ${(props) => (props.$compact ? '170px' : 'none')};

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

const SectionTitle = styled.h3`
  display: inline-flex;
  align-items: baseline;
  gap: var(--ds-space-2);
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
    font-weight: var(--ds-font-weight-normal);
  }
`;

const LinesShell = styled.div`
  overflow-x: auto;
  overflow-y: hidden;
  border-top: 1px solid var(--ds-color-border-default);
  border-bottom: 1px solid var(--ds-color-border-default);
  background: var(--ds-color-bg-surface);
`;

const LinesTable = styled(VmTable)`
  width: 100%;
  border: 0;
  border-radius: 0;
  box-shadow: none;

  .table__scroll-container {
    border-radius: 0;
  }

  .table__column,
  .table__cell {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: top;
  }

  .table__column {
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    font-weight: var(--ds-font-weight-semibold);
    color: var(--ds-color-text-secondary);
    background: var(--ds-color-bg-subtle);
    border-bottom: 1px solid var(--ds-color-border-default);
  }

  .table__column:first-child,
  .table__cell:first-child {
    width: 44px;
    min-width: 44px;
    text-align: center;
    color: var(--ds-color-text-secondary);
  }

  .table__column:nth-child(2),
  .table__cell:nth-child(2) {
    min-width: 280px;
  }

  .table__column:nth-child(3),
  .table__cell:nth-child(3) {
    min-width: 260px;
  }

  .table__column:nth-child(4),
  .table__cell:nth-child(4),
  .table__column:nth-child(5),
  .table__cell:nth-child(5) {
    width: 140px;
    min-width: 140px;
  }

  .table__column:last-child,
  .table__cell:last-child {
    width: 56px;
    min-width: 56px;
    text-align: center;
  }
`;

const ManualLinesContent = styled(VmTable.Content)`
  min-width: 920px;
`;

const ManualLinesHeader = styled(VmTable.Header)`
  .table__column {
    background: var(--ds-color-bg-subtle);
  }

  && .table__row:not(#manual-entry-totals):hover > .table__cell,
  && .table__row:not(#manual-entry-totals)[data-hovered='true']
    > .table__cell {
    background: var(--ds-color-bg-surface) !important;
  }

  && #manual-entry-totals:hover > .table__cell,
  && #manual-entry-totals[data-hovered='true'] > .table__cell {
    background: var(--ds-color-bg-subtle) !important;
  }
`;

const AmountNumberField = styled(VmNumberField)`
  width: 100%;

  .number-field__input {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
`;

const AddLineButton = styled(VmButton)`
  margin: var(--ds-space-3) var(--ds-space-4);
`;

const BalanceBanner = styled.div<{ $balanced: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  margin: 0 var(--ds-space-4) var(--ds-space-4);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-radius: var(--ds-radius-md);
  background: ${({ $balanced }) =>
    $balanced
      ? 'var(--ds-color-state-success-subtle)'
      : 'var(--ds-color-state-danger-subtle)'};
  color: ${({ $balanced }) =>
    $balanced
      ? 'var(--ds-color-state-success-text)'
      : 'var(--ds-color-state-danger-text)'};
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);

  strong {
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const TotalsRow = styled(VmTable.Row)`
  background: var(--ds-color-bg-subtle);

  .table__cell {
    padding: var(--ds-space-3) var(--ds-space-4);
    border-top: 1px solid var(--ds-color-border-default);
  }

  .table__cell:first-child {
    text-align: left;
  }
`;

const TfootLabel = styled.span`
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
  text-transform: uppercase;
  letter-spacing: var(--ds-letter-spacing-wide);
  color: var(--ds-color-text-secondary);
`;

const TotalsNumCell = styled(VmTable.Cell)<{
  $error?: boolean;
  $tone: 'debit' | 'credit';
}>`
  && {
    text-align: right;
  }

  font-variant-numeric: tabular-nums;
  font-weight: var(--ds-font-weight-semibold);
  font-size: var(--ds-font-size-base);
  color: ${({ $error, $tone }) =>
    $error
      ? 'var(--ds-color-state-danger-text)'
      : $tone === 'debit'
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-state-danger-text)'};
  white-space: nowrap;
`;

const SupportGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-4);
  align-items: stretch;

  @media (max-width: 980px) {
    grid-template-columns: 1fr;
  }
`;

const SideCard = styled(VmCard)`
  overflow: hidden;
`;

const SideTitle = styled.h3`
  margin: 0;
  padding: var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-default);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-base);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const SummaryRows = styled.div`
  display: flex;
  flex-direction: column;
`;

const SummaryRow = styled.div<{ $tone?: 'debit' | 'credit' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);

  &:last-child {
    border-bottom: none;
  }

  strong {
    color: ${({ $tone }) =>
      $tone === 'debit'
        ? 'var(--ds-color-state-success-text)'
        : $tone === 'credit'
          ? 'var(--ds-color-state-danger-text)'
          : 'var(--ds-color-text-primary)'};
    font-weight: var(--ds-font-weight-semibold);
    font-variant-numeric: tabular-nums;
  }
`;

const ValidationList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ValidationItem = styled.div<{ $ok: boolean }>`
  display: flex;
  align-items: center;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3) var(--ds-space-4);
  border-bottom: 1px solid var(--ds-color-border-subtle);
  color: ${({ $ok }) =>
    $ok ? 'var(--ds-color-text-primary)' : 'var(--ds-color-text-secondary)'};
  font-size: var(--ds-font-size-sm);

  &:last-child {
    border-bottom: none;
  }

  svg {
    color: ${({ $ok }) =>
      $ok
        ? 'var(--ds-color-state-success-text)'
        : 'var(--ds-color-text-disabled)'};
  }
`;

const TemplateList = styled.div`
  display: flex;
  flex-direction: column;
`;

const TemplateButton = styled(VmButton)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
  width: 100%;
  padding: var(--ds-space-3) var(--ds-space-4);
  border: 0;
  border-bottom: 1px solid var(--ds-color-border-subtle);
  background: transparent;
  color: var(--ds-color-text-primary);
  font: inherit;
  font-size: var(--ds-font-size-sm);
  text-align: left;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: var(--ds-color-interactive-hover-bg);
  }
`;
