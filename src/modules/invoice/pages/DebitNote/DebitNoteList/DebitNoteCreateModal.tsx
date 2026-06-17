import { SaveOutlined } from '@/constants/icons/antd';
import {
  Alert,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Spin,
  message,
} from 'antd';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { useFbGetClientsOnOpen } from '@/firebase/client/useFbGetClientsOnOpen';
import { fbAddDebitNote } from '@/modules/invoice/firebase/debitNotes/fbAddDebitNote';
import { useFbGetInvoicesByClient } from '@/firebase/invoices/useFbGetInvoicesByClient';
import { formatDate } from '@/utils/date/dateUtils';
import { formatPrice } from '@/utils/format';

import {
  FormGrid,
  FullWidth,
  InvoiceSummary,
  SummaryLabel,
  SummaryValue,
} from './DebitNoteCreateModal.styles';

import type { DebitNoteCreateInput } from '@/modules/invoice/types/debitNote';
import type { InvoiceClient, InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';
import type { TimestampLike } from '@/utils/date/types';

type UserRootState = Parameters<typeof selectUser>[0];

type ClientWrapper = {
  id?: string | number;
  client: InvoiceClient;
};

type InvoiceWithNcf = InvoiceData & {
  ncf?: string;
};

interface DebitNoteCreateModalProps {
  open: boolean;
  onClose: () => void;
}

interface DebitNoteCreateFormValues {
  clientId?: string;
  invoiceId?: string;
  totalAmount?: number;
  taxAmount?: number;
  modificationCode?: string;
  reason?: string;
}

const MODIFICATION_CODE_OPTIONS = [
  { value: '1', label: '1 - Anula el comprobante modificado' },
  { value: '2', label: '2 - Corrige texto' },
  { value: '3', label: '3 - Corrige montos' },
  { value: '4', label: '4 - Reemplazo por contingencia' },
  { value: '5', label: '5 - Referencia factura de consumo electronica' },
];

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const resolveInvoiceNcf = (invoice: InvoiceWithNcf | null | undefined) =>
  invoice?.ncf || invoice?.NCF || invoice?.eNcf || '';

const resolveInvoiceTotal = (invoice: InvoiceWithNcf | null | undefined) =>
  toFiniteNumber(
    invoice?.totalPurchase?.value ??
      invoice?.total ??
      invoice?.payment?.value ??
      0,
  );

const resolveInvoiceDate = (
  invoice: InvoiceWithNcf | null | undefined,
): TimestampLike | undefined =>
  invoice?.date ?? (invoice?.createdAt as TimestampLike | undefined);

export const DebitNoteCreateModal = ({
  open,
  onClose,
}: DebitNoteCreateModalProps) => {
  const [form] = Form.useForm<DebitNoteCreateFormValues>();
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { clients: fetchedClients, loading: clientsLoading } =
    useFbGetClientsOnOpen({ isOpen: open }) as {
      clients: ClientWrapper[];
      loading: boolean;
    };

  const clients = useMemo(
    () =>
      fetchedClients.map((entry) => ({
        ...entry.client,
        id: entry.client?.id ?? entry.id,
      })),
    [fetchedClients],
  );

  const { invoices, loading: invoicesLoading } = useFbGetInvoicesByClient(
    selectedClientId,
  ) as { invoices: InvoiceWithNcf[]; loading: boolean };

  const currentClient = useMemo(
    () => clients.find((client) => String(client.id) === selectedClientId) ?? null,
    [clients, selectedClientId],
  );
  const currentInvoice = useMemo(
    () => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null,
    [invoices, selectedInvoiceId],
  );
  const currentInvoiceNcf = resolveInvoiceNcf(currentInvoice);
  const currentInvoiceTotal = resolveInvoiceTotal(currentInvoice);

  const resetAndClose = () => {
    form.resetFields();
    setSelectedClientId(null);
    setSelectedInvoiceId(null);
    setSubmitting(false);
    onClose();
  };

  const handleClientChange = (value: string) => {
    setSelectedClientId(value || null);
    setSelectedInvoiceId(null);
    form.setFieldsValue({ invoiceId: undefined });
  };

  const handleInvoiceChange = (value: string) => {
    setSelectedInvoiceId(value || null);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (!currentClient || !currentInvoice) {
      message.error('Selecciona el cliente y la factura afectada');
      return;
    }

    const invoiceDate = resolveInvoiceDate(currentInvoice);
    if (!currentInvoiceNcf || !invoiceDate) {
      message.error('La factura afectada necesita NCF y fecha para emitir E33');
      return;
    }

    setSubmitting(true);
    try {
      const payload: DebitNoteCreateInput = {
        client: currentClient,
        invoiceId: currentInvoice.id,
        invoiceNcf: currentInvoiceNcf,
        invoiceNumber: currentInvoice.numberID,
        invoiceDate,
        invoiceTotalAmount: currentInvoiceTotal || undefined,
        totalAmount: values.totalAmount || 0,
        taxAmount: values.taxAmount || 0,
        modificationCode: values.modificationCode || '3',
        reason: values.reason?.trim() || 'Correccion de montos',
        items: [],
      };
      const note = await fbAddDebitNote(user, payload);
      message.success(
        `Nota de debito creada: ${note.ncf || note.number || 'pendiente e-CF'}`,
      );
      resetAndClose();
    } catch (error) {
      console.error('Error al crear nota de debito:', error);
      message.error('No se pudo crear la nota de debito');
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Nueva nota de debito"
      open={open}
      onCancel={resetAndClose}
      width={720}
      footer={[
        <Button key="cancel" onClick={resetAndClose}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          icon={<SaveOutlined />}
          loading={submitting}
          onClick={() => {
            void handleSubmit();
          }}
        >
          Crear nota
        </Button>,
      ]}
    >
      <Spin spinning={clientsLoading}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="La nota de debito aumenta el monto de una factura existente y se emite como E33 cuando el negocio usa e-CF."
        />
        <Form
          form={form}
          layout="vertical"
          initialValues={{ modificationCode: '3', taxAmount: 0 }}
        >
          <FormGrid>
            <Form.Item
              label="Cliente"
              name="clientId"
              rules={[{ required: true, message: 'Selecciona el cliente' }]}
            >
              <Select
                showSearch
                placeholder="Seleccionar cliente"
                optionFilterProp="label"
                options={clients.map((client) => ({
                  value: String(client.id),
                  label: `${client.name || 'Cliente sin nombre'}${
                    client.rnc || client.personalID
                      ? ` - ${client.rnc || client.personalID}`
                      : ''
                  }`,
                }))}
                onChange={handleClientChange}
              />
            </Form.Item>

            <Form.Item
              label="Factura afectada"
              name="invoiceId"
              rules={[{ required: true, message: 'Selecciona la factura' }]}
            >
              <Select
                showSearch
                placeholder={
                  selectedClientId
                    ? 'Seleccionar factura'
                    : 'Selecciona un cliente primero'
                }
                loading={invoicesLoading}
                disabled={!selectedClientId}
                optionFilterProp="label"
                options={invoices.map((invoice) => ({
                  value: String(invoice.id),
                  label: `#${invoice.numberID || '-'} - ${
                    resolveInvoiceNcf(invoice) || 'Sin NCF'
                  } - ${formatPrice(resolveInvoiceTotal(invoice))}`,
                }))}
                onChange={handleInvoiceChange}
              />
            </Form.Item>

            {currentInvoice && (
              <FullWidth>
                <InvoiceSummary>
                  <div>
                    <SummaryLabel>NCF afectado</SummaryLabel>
                    <SummaryValue>{currentInvoiceNcf || 'N/A'}</SummaryValue>
                  </div>
                  <div>
                    <SummaryLabel>Fecha factura</SummaryLabel>
                    <SummaryValue>
                      {resolveInvoiceDate(currentInvoice)
                        ? formatDate(resolveInvoiceDate(currentInvoice))
                        : 'N/A'}
                    </SummaryValue>
                  </div>
                  <div>
                    <SummaryLabel>Total factura</SummaryLabel>
                    <SummaryValue>{formatPrice(currentInvoiceTotal)}</SummaryValue>
                  </div>
                </InvoiceSummary>
              </FullWidth>
            )}

            <Form.Item
              label="Monto de la nota"
              name="totalAmount"
              rules={[
                { required: true, message: 'Indica el monto' },
                {
                  type: 'number',
                  min: 0.01,
                  message: 'El monto debe ser mayor a cero',
                },
              ]}
            >
              <InputNumber
                min={0.01}
                precision={2}
                step={0.01}
                style={{ width: '100%' }}
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item label="ITBIS incluido" name="taxAmount">
              <InputNumber
                min={0}
                precision={2}
                step={0.01}
                style={{ width: '100%' }}
                placeholder="0.00"
              />
            </Form.Item>

            <Form.Item
              label="Codigo modificacion DGII"
              name="modificationCode"
              rules={[{ required: true, message: 'Selecciona el codigo DGII' }]}
            >
              <Select options={MODIFICATION_CODE_OPTIONS} />
            </Form.Item>

            <FullWidth>
              <Form.Item
                label="Motivo"
                name="reason"
                rules={[{ required: true, message: 'Indica el motivo' }]}
              >
                <Input.TextArea
                  rows={3}
                  maxLength={120}
                  showCount
                  placeholder="Ej. Correccion de montos"
                />
              </Form.Item>
            </FullWidth>
          </FormGrid>
        </Form>
      </Spin>
    </Modal>
  );
};
