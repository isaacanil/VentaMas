import { useMemo, useRef, useState } from 'react';
import { Alert, Button, Modal, Table, Tag, Typography } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import type { BankAccount, LiquidityLedgerEntry } from '@/types/accounting';
import type { BankStatementLineDraft } from '@/modules/treasury/utils/records';
import {
  parseBankStatementImport,
  planBankStatementImport,
  type PlannedBankStatementImportRow,
} from '@/modules/treasury/utils/bankStatementImport';

interface BankStatementImportModalProps {
  bankAccount: BankAccount | null;
  ledgerEntries: LiquidityLedgerEntry[];
  open: boolean;
  onCancel: () => void;
  onSubmit: (drafts: BankStatementLineDraft[]) => Promise<{
    failures?: Array<{ lineNumber: number; message: string }>;
  } | void>;
  submitting?: boolean;
}

const formatMoney = (amount: number, currency: string) =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

const formatDate = (value: Date) =>
  new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(value);

export const BankStatementImportModal = ({
  bankAccount,
  ledgerEntries,
  open,
  onCancel,
  onSubmit,
  submitting = false,
}: BankStatementImportModalProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [issues, setIssues] = useState<string[]>([]);
  const [parsing, setParsing] = useState(false);
  const [plannedRows, setPlannedRows] = useState<PlannedBankStatementImportRow[]>([]);
  const [sourceFormat, setSourceFormat] = useState<'csv' | 'ofx' | null>(null);

  const validRows = useMemo(
    () => plannedRows.map<BankStatementLineDraft>((row) => ({
      amount: row.amount,
      bankAccountId: bankAccount?.id ?? '',
      description: row.description,
      direction: row.direction,
      movementIds: row.movementIds,
      reference: row.reference,
      statementDate: row.statementDate,
    })),
    [bankAccount?.id, plannedRows],
  );
  const exactMatchCount = plannedRows.filter(
    (row) => row.matchStatus === 'reconciled',
  ).length;
  const pendingCount = plannedRows.length - exactMatchCount;
  const canImport = Boolean(bankAccount && validRows.length > 0 && !parsing);

  const resetState = () => {
    setFileName(null);
    setIssues([]);
    setPlannedRows([]);
    setSourceFormat(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleFileSelection = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setParsing(true);
    try {
      const text = await file.text();
      const parsed = parseBankStatementImport({
        fileName: file.name,
        text,
      });
      const planned = planBankStatementImport({
        entries: ledgerEntries,
        rows: parsed.rows,
      });

      setFileName(file.name);
      setIssues(parsed.issues);
      setPlannedRows(planned);
      setSourceFormat(parsed.format);
    } finally {
      setParsing(false);
    }
  };

  const handleSubmit = async () => {
    const result = await onSubmit(validRows);
    if (!result?.failures?.length) {
      resetState();
    }
  };

  return (
    <Modal
      destroyOnClose
      title="Importar extracto bancario"
      open={open}
      width={960}
      okText="Importar líneas"
      cancelText="Cancelar"
      closable={!submitting}
      confirmLoading={submitting}
      keyboard={!submitting}
      maskClosable={false}
      cancelButtonProps={{ disabled: submitting }}
      okButtonProps={{ disabled: !canImport || submitting }}
      onCancel={() => {
        if (submitting) return;
        resetState();
        onCancel();
      }}
      onOk={handleSubmit}
    >
      <input
        ref={inputRef}
        hidden
        accept=".csv,.ofx,.qfx,.txt"
        type="file"
        onChange={(event) => {
          void handleFileSelection(event);
        }}
      />

      <Alert
        style={{ marginBottom: 16 }}
        type="info"
        showIcon
        message="Importa CSV u OFX"
        description="Se sugieren matches exactos con movimientos bancarios aún no conciliados. Lo no exacto entra como excepción pendiente."
      />

      <Button
        icon={<UploadOutlined />}
        loading={parsing}
        disabled={submitting}
        onClick={() => inputRef.current?.click()}
      >
        {fileName ? 'Cambiar archivo' : 'Seleccionar archivo'}
      </Button>

      {fileName ? (
        <Typography.Paragraph style={{ marginTop: 12, marginBottom: 12 }}>
          Archivo: <strong>{fileName}</strong>{' '}
          {sourceFormat ? <Tag>{sourceFormat.toUpperCase()}</Tag> : null}
        </Typography.Paragraph>
      ) : null}

      {issues.length > 0 ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message={`${issues.length} fila(s) quedaron fuera del import`}
          description={issues.slice(0, 4).join(' ')}
        />
      ) : null}

      {plannedRows.length > 0 ? (
        <>
          <Alert
            style={{ marginBottom: 16 }}
            type={pendingCount > 0 ? 'warning' : 'success'}
            showIcon
            message={`${plannedRows.length} línea(s) listas para importar`}
            description={`${exactMatchCount} con match exacto. ${pendingCount} quedarán pendientes.`}
          />

          <Table<PlannedBankStatementImportRow>
            size="small"
            rowKey="id"
            pagination={{ pageSize: 8, hideOnSinglePage: true }}
            dataSource={plannedRows}
            columns={[
              {
                dataIndex: 'statementDate',
                key: 'statementDate',
                title: 'Fecha',
                width: 110,
                render: (value: Date) => formatDate(value),
              },
              {
                dataIndex: 'reference',
                key: 'reference',
                title: 'Referencia',
                width: 160,
                render: (value: string | null) => value || 'Sin referencia',
              },
              {
                dataIndex: 'description',
                key: 'description',
                title: 'Descripción',
                render: (value: string | null) => value || 'Sin descripción',
              },
              {
                dataIndex: 'amount',
                key: 'amount',
                title: 'Monto',
                width: 140,
                render: (value: number, record) =>
                  formatMoney(
                    record.direction === 'out' ? -value : value,
                    bankAccount?.currency ?? 'DOP',
                  ),
              },
              {
                key: 'match',
                title: 'Match',
                width: 220,
                render: (_, record) =>
                  record.matchStatus === 'reconciled' ? (
                    <>
                      <Tag color="success">
                        {record.confidence === 'high'
                          ? 'Exacto alto'
                          : record.confidence === 'medium'
                            ? 'Exacto medio'
                            : 'Exacto'}
                      </Tag>
                      <div>{record.movementLabels.join(', ')}</div>
                    </>
                  ) : (
                    <Tag color="warning">Pendiente</Tag>
                  ),
              },
            ]}
          />
        </>
      ) : null}
    </Modal>
  );
};
