import { useEffect, useMemo } from 'react';
import { Alert, Button, Form, Input, Modal, Radio, Select } from 'antd';

import type { BankAccount, BankStatementLine, LiquidityLedgerEntry } from '@/types/accounting';
import type { ResolveBankStatementLineDraft } from '@/modules/treasury/utils/records';
import { suggestBankStatementLineMatch } from '@/modules/treasury/utils/bankStatementMatching';

interface ResolveBankStatementLineFormValues {
  movementIds?: string[];
  resolutionMode?: 'match' | 'write_off';
  statementLineId: string;
  writeOffNotes?: string;
  writeOffReason?: string;
}

interface ResolveBankStatementLineModalProps {
  bankAccount: BankAccount | null;
  ledgerEntries: LiquidityLedgerEntry[];
  open: boolean;
  onCancel: () => void;
  onSubmit: (draft: ResolveBankStatementLineDraft) => Promise<void>;
  pendingStatementLines: BankStatementLine[];
  submitting?: boolean;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

export const ResolveBankStatementLineModal = ({
  bankAccount,
  ledgerEntries,
  open,
  onCancel,
  onSubmit,
  pendingStatementLines,
  submitting = false,
}: ResolveBankStatementLineModalProps) => {
  const [form] = Form.useForm<ResolveBankStatementLineFormValues>();

  useEffect(() => {
    if (!open) return;

    const firstStatementLineId = pendingStatementLines[0]?.id;
    const nextStatementLine =
      pendingStatementLines.find(
        (statementLine) => statementLine.id === firstStatementLineId,
      ) ?? null;
    const suggestion = suggestBankStatementLineMatch({
      entries: ledgerEntries,
      line: nextStatementLine,
    });

    form.resetFields();
    form.setFieldsValue({
      movementIds: suggestion?.movementIds ?? [],
      statementLineId: firstStatementLineId ?? undefined,
    });
  }, [form, ledgerEntries, open, pendingStatementLines]);

  const selectedStatementLineId = Form.useWatch('statementLineId', form);
  const selectedMovementIdsInput = Form.useWatch('movementIds', form);
  const resolutionMode = Form.useWatch('resolutionMode', form) ?? 'match';
  const writeOffReason = Form.useWatch('writeOffReason', form);
  const selectedMovementIds = useMemo(
    () => selectedMovementIdsInput ?? [],
    [selectedMovementIdsInput],
  );
  const selectedStatementLine =
    pendingStatementLines.find((statementLine) => statementLine.id === selectedStatementLineId) ??
    null;
  const availableEntries = useMemo(
    () =>
      ledgerEntries.filter(
        (entry) =>
          entry.accountType === 'bank' &&
          entry.status !== 'void' &&
          entry.reconciliationStatus !== 'reconciled',
      ),
    [ledgerEntries],
  );
  const selectedMovements = useMemo(
    () =>
      availableEntries.filter((entry) => selectedMovementIds.includes(entry.id)),
    [availableEntries, selectedMovementIds],
  );
  const selectedMovementTotal = Number(
    selectedMovements
      .reduce(
        (sum, entry) =>
          sum + (entry.direction === 'out' ? -Number(entry.amount) : Number(entry.amount)),
        0,
      )
      .toFixed(2),
  );
  const signedStatementAmount = selectedStatementLine
    ? Number(
        (
          selectedStatementLine.direction === 'out'
            ? -Number(selectedStatementLine.amount ?? 0)
            : Number(selectedStatementLine.amount ?? 0)
        ).toFixed(2),
      )
    : 0;
  const exactMatch =
    selectedStatementLine != null &&
    selectedMovements.length > 0 &&
    signedStatementAmount === selectedMovementTotal;
  const differenceAmount = Number(
    (signedStatementAmount - selectedMovementTotal).toFixed(2),
  );
  const canWriteOff =
    selectedStatementLine != null &&
    Boolean(writeOffReason?.trim()) &&
    differenceAmount !== 0;
  const suggestion = useMemo(
    () =>
      suggestBankStatementLineMatch({
        entries: ledgerEntries,
        line: selectedStatementLine,
      }),
    [ledgerEntries, selectedStatementLine],
  );

  const statementLineOptions = useMemo(
    () =>
      pendingStatementLines.map((statementLine) => ({
        label: `${statementLine.reference || statementLine.description || statementLine.id} · ${formatMoney(
          statementLine.direction === 'out'
            ? -Number(statementLine.amount ?? 0)
            : Number(statementLine.amount ?? 0),
          bankAccount?.currency ?? 'DOP',
        )}`,
        value: statementLine.id,
      })),
    [bankAccount?.currency, pendingStatementLines],
  );
  const movementOptions = useMemo(
    () =>
      availableEntries.map((entry) => ({
        label: `${entry.reference || entry.description || entry.sourceType} · ${formatMoney(
          entry.direction === 'out' ? -Number(entry.amount) : Number(entry.amount),
          entry.currency,
        )}`,
        value: entry.id,
      })),
    [availableEntries],
  );

  const handleSubmit = async () => {
    const values = await form.validateFields();
    await onSubmit({
      movementIds: values.movementIds ?? [],
      resolutionMode: values.resolutionMode ?? 'match',
      statementLineId: values.statementLineId,
      writeOffNotes: values.writeOffNotes?.trim() || null,
      writeOffReason: values.writeOffReason?.trim() || null,
    });
  };

  return (
    <Modal
      destroyOnClose
      title="Resolver excepción bancaria"
      open={open}
      okText={resolutionMode === 'write_off' ? 'Ajustar diferencia' : 'Resolver'}
      cancelText="Cancelar"
      closable={!submitting}
      confirmLoading={submitting}
      keyboard={!submitting}
      maskClosable={false}
      cancelButtonProps={{ disabled: submitting }}
      okButtonProps={{
        disabled: resolutionMode === 'write_off' ? !canWriteOff : !exactMatch,
      }}
      onCancel={() => {
        if (submitting) return;
        onCancel();
      }}
      onOk={handleSubmit}
    >
      <Form
        form={form}
        initialValues={{ resolutionMode: 'match' }}
        layout="vertical"
      >
        <Form.Item
          label="Línea pendiente"
          name="statementLineId"
          rules={[{ required: true, message: 'Seleccione la línea pendiente.' }]}
        >
          <Select
            disabled={submitting}
            options={statementLineOptions}
            optionFilterProp="label"
            showSearch
            onChange={(value) => {
              const nextStatementLine =
                pendingStatementLines.find(
                  (statementLine) => statementLine.id === value,
                ) ?? null;
              const nextSuggestion = suggestBankStatementLineMatch({
                entries: ledgerEntries,
                line: nextStatementLine,
              });
              form.setFieldsValue({
                movementIds: nextSuggestion?.movementIds ?? [],
                resolutionMode: 'match',
                statementLineId: value,
                writeOffNotes: undefined,
                writeOffReason: undefined,
              });
            }}
          />
        </Form.Item>

        <Form.Item label="Modo de resolución" name="resolutionMode">
          <Radio.Group
            buttonStyle="solid"
            disabled={submitting}
            optionType="button"
            options={[
              { label: 'Match exacto', value: 'match' },
              { label: 'Write-off / ajuste', value: 'write_off' },
            ]}
          />
        </Form.Item>

        <Alert
          style={{ marginBottom: 16 }}
          type={
            resolutionMode === 'write_off'
              ? canWriteOff
                ? 'warning'
                : 'info'
              : exactMatch
                ? 'success'
                : 'warning'
          }
          showIcon
          message={
            resolutionMode === 'write_off'
              ? canWriteOff
                ? 'Ajuste de diferencia listo'
                : 'Define ajuste para cerrar la excepción'
              : exactMatch
                ? 'Match exacto listo para resolver'
                : 'Aún no cuadra con la excepción'
          }
          description={
            selectedStatementLine
              ? resolutionMode === 'write_off'
                ? `Línea ${formatMoney(
                    signedStatementAmount,
                    bankAccount?.currency ?? 'DOP',
                  )} vs movimientos ${formatMoney(
                    selectedMovementTotal,
                    bankAccount?.currency ?? 'DOP',
                  )}. Diferencia a ajustar ${formatMoney(
                    differenceAmount,
                    bankAccount?.currency ?? 'DOP',
                  )}.`
                : `Línea ${formatMoney(
                    signedStatementAmount,
                    bankAccount?.currency ?? 'DOP',
                  )} vs movimientos ${formatMoney(
                    selectedMovementTotal,
                    bankAccount?.currency ?? 'DOP',
                  )}.`
              : 'Selecciona una línea pendiente para continuar.'
          }
        />

        {suggestion ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message={`Sugerencia ${suggestion.confidence}`}
            description={
              <>
                {`${suggestion.reason} Total sugerido ${formatMoney(
                  suggestion.movementTotal,
                  bankAccount?.currency ?? 'DOP',
                )}.`}
                <div style={{ marginTop: 8 }}>
                  <Button
                    size="small"
                    disabled={submitting}
                    onClick={() => {
                      form.setFieldValue('movementIds', suggestion.movementIds);
                    }}
                  >
                    Aplicar sugerencia
                  </Button>
                </div>
              </>
            }
          />
        ) : null}

        <Form.Item label="Movimientos a vincular" name="movementIds">
          <Select
            disabled={submitting}
            mode="multiple"
            options={movementOptions}
            placeholder="Selecciona movimientos del ledger"
            optionFilterProp="label"
            showSearch
          />
        </Form.Item>

        {resolutionMode === 'write_off' ? (
          <>
            <Form.Item
              label="Motivo del ajuste"
              name="writeOffReason"
              rules={[
                {
                  required: true,
                  message: 'Selecciona el motivo del ajuste.',
                },
              ]}
            >
              <Select
                disabled={submitting}
                options={[
                  { label: 'Comisión bancaria', value: 'bank_fee' },
                  { label: 'Redondeo', value: 'rounding' },
                  { label: 'Movimiento bancario no registrado', value: 'unrecorded_bank_movement' },
                  { label: 'Otro', value: 'other' },
                ]}
              />
            </Form.Item>

            <Form.Item label="Notas del ajuste" name="writeOffNotes">
              <Input.TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                disabled={submitting}
                placeholder="Explica por qué la línea no cuadrará exacto."
              />
            </Form.Item>
          </>
        ) : null}
      </Form>
    </Modal>
  );
};
