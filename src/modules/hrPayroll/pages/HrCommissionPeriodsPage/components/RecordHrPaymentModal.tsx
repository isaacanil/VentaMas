import { DatePicker, Form, Input, Modal, Select } from 'antd';
import type { FormInstance } from 'antd';
import type { Dayjs } from 'dayjs';

import {
  HrCellStack as CellStack,
  HrMutedText as MutedText,
  HrPrimaryText as PrimaryText,
} from '@/modules/hrPayroll/components/HrPayrollPagePrimitives';
import { formatHrMoney as formatMoney } from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type {
  HrPaymentMethod,
  HrPayrollEmployeeLineRecord,
} from '@/types/hrPayroll';

export interface PaymentFormValues {
  bankAccountId?: string;
  cashAccountId?: string;
  cashCountId?: string;
  checkNumber?: string;
  paymentDate?: Dayjs;
  paymentMethod: HrPaymentMethod;
  reference?: string;
  transferReference?: string;
}

interface RecordHrPaymentModalProps {
  actionKey: string | null;
  form: FormInstance<PaymentFormValues>;
  line: HrPayrollEmployeeLineRecord | null;
  onCancel: () => void;
  onFinish: (values: PaymentFormValues) => void | Promise<void>;
  onSubmit: () => void;
}

export function RecordHrPaymentModal({
  actionKey,
  form,
  line,
  onCancel,
  onFinish,
  onSubmit,
}: RecordHrPaymentModalProps) {
  const watchedPaymentMethod = Form.useWatch('paymentMethod', form);

  return (
    <Modal
      title="Registrar pago"
      open={Boolean(line)}
      okText="Registrar"
      cancelText="Cancelar"
      confirmLoading={Boolean(line && actionKey === `pay:${line.id}`)}
      destroyOnHidden
      onCancel={onCancel}
      onOk={onSubmit}
    >
      {line ? (
        <CellStack>
          <PrimaryText>
            {line.employeeNameSnapshot || line.employeeCode || line.employeeId}
          </PrimaryText>
          <MutedText>{formatMoney(line.netAmount, line.currency)}</MutedText>
        </CellStack>
      ) : null}

      <Form<PaymentFormValues>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        style={{ marginTop: 16 }}
      >
        <Form.Item
          name="paymentDate"
          label="Fecha de pago"
          rules={[{ required: true, message: 'Selecciona la fecha.' }]}
        >
          <DatePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item
          name="paymentMethod"
          label="Metodo"
          rules={[{ required: true, message: 'Selecciona el metodo.' }]}
        >
          <Select
            options={[
              { value: 'cash', label: 'Efectivo' },
              { value: 'bank_transfer', label: 'Transferencia' },
              { value: 'check', label: 'Cheque' },
              { value: 'other', label: 'Otro' },
            ]}
          />
        </Form.Item>

        {watchedPaymentMethod === 'cash' ? (
          <>
            <Form.Item name="cashAccountId" label="Caja">
              <Input placeholder="ID de caja" />
            </Form.Item>
            <Form.Item name="cashCountId" label="Cuadre">
              <Input placeholder="ID de cuadre" />
            </Form.Item>
          </>
        ) : null}

        {watchedPaymentMethod && watchedPaymentMethod !== 'cash' ? (
          <Form.Item name="bankAccountId" label="Cuenta bancaria">
            <Input placeholder="ID de cuenta" />
          </Form.Item>
        ) : null}

        {watchedPaymentMethod === 'check' ? (
          <Form.Item name="checkNumber" label="Cheque">
            <Input placeholder="Numero de cheque" />
          </Form.Item>
        ) : null}

        <Form.Item name="transferReference" label="Referencia bancaria">
          <Input placeholder="Referencia" />
        </Form.Item>
        <Form.Item name="reference" label="Referencia interna">
          <Input placeholder="Referencia" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
