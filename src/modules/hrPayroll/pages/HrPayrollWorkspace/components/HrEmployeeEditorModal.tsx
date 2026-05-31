import { Button, Form, Input, InputNumber, Modal, Select, Switch } from 'antd';
import type { FormInstance } from 'antd';
import styled from 'styled-components';

import {
  HR_COMMISSION_TYPE_LABELS as COMMISSION_TYPE_LABELS,
  HR_EMPLOYEE_PAY_TYPE_LABELS as PAY_TYPE_LABELS,
  HR_EMPLOYEE_STATUS_LABELS as STATUS_LABELS,
  HR_PAYMENT_METHOD_LABELS as PAYMENT_METHOD_LABELS,
} from '@/modules/hrPayroll/utils/hrPayrollDisplay';
import type { HrEmployeeInput, HrEmployeeRecord } from '@/types/hrPayroll';

export type HrEmployeeFormValues = HrEmployeeInput;

const FieldGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const FullWidthField = styled.div`
  grid-column: 1 / -1;
`;

const ModalActions = styled.div`
  display: flex;
  gap: var(--ds-space-2);
  justify-content: flex-end;
  margin-top: var(--ds-space-2);
`;

interface HrEmployeeEditorModalProps {
  employee: HrEmployeeRecord | null;
  form: FormInstance<HrEmployeeFormValues>;
  initialValues: HrEmployeeFormValues;
  onCancel: () => void;
  onSave: (values: HrEmployeeFormValues) => void | Promise<void>;
  open: boolean;
  saving: boolean;
  userOptions: Array<{ label: string; value: string }>;
}

export function HrEmployeeEditorModal({
  employee,
  form,
  initialValues,
  onCancel,
  onSave,
  open,
  saving,
  userOptions,
}: HrEmployeeEditorModalProps) {
  return (
    <Modal
      title={employee ? 'Editar empleado' : 'Nuevo empleado'}
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
      afterClose={() => form.resetFields()}
    >
      <Form<HrEmployeeFormValues>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSave}
      >
        <FieldGrid>
          <Form.Item
            name="code"
            label="Codigo"
            rules={[{ required: true, message: 'El codigo es requerido.' }]}
          >
            <Input placeholder="EMP-001" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Estado"
            rules={[{ required: true, message: 'El estado es requerido.' }]}
          >
            <Select
              options={Object.entries(STATUS_LABELS).map(([value, label]) => ({
                value,
                label,
              }))}
            />
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre es requerido.' }]}
          >
            <Input placeholder="Nombre del colaborador" />
          </Form.Item>
          <Form.Item name="documentId" label="Documento">
            <Input placeholder="Cedula, pasaporte o RNC" />
          </Form.Item>
          <Form.Item name="linkedUserId" label="Usuario vinculado">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sin usuario"
              options={userOptions}
            />
          </Form.Item>
          <Form.Item name="email" label="Correo">
            <Input type="email" placeholder="correo@empresa.com" />
          </Form.Item>
          <Form.Item name="phone" label="Telefono">
            <Input placeholder="809-000-0000" />
          </Form.Item>
          <Form.Item name="payType" label="Tipo de pago">
            <Select
              options={Object.entries(PAY_TYPE_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
            />
          </Form.Item>
          <Form.Item name="baseSalaryAmount" label="Salario base">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="hourlyRateAmount" label="Tarifa por hora">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="currency" label="Moneda">
            <Input maxLength={3} placeholder="DOP" />
          </Form.Item>
          <Form.Item name="paymentMethod" label="Metodo de pago">
            <Select
              options={Object.entries(PAYMENT_METHOD_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
            />
          </Form.Item>
          <Form.Item name="paymentDestination" label="Destino de pago">
            <Input placeholder="Cuenta, banco o referencia" />
          </Form.Item>
          <Form.Item
            name="commissionEnabled"
            label="Comisiones"
            valuePropName="checked"
          >
            <Switch checkedChildren="Activas" unCheckedChildren="No" />
          </Form.Item>
          <Form.Item name="defaultCommissionType" label="Tipo de comision">
            <Select
              options={Object.entries(COMMISSION_TYPE_LABELS).map(
                ([value, label]) => ({
                  value,
                  label,
                }),
              )}
            />
          </Form.Item>
          <Form.Item name="defaultCommissionRate" label="Valor de comision">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <FullWidthField>
            <Form.Item name="address" label="Direccion">
              <Input placeholder="Direccion" />
            </Form.Item>
          </FullWidthField>
          <FullWidthField>
            <Form.Item name="notes" label="Notas">
              <Input.TextArea rows={3} placeholder="Notas internas" />
            </Form.Item>
          </FullWidthField>
        </FieldGrid>

        <ModalActions>
          <Button onClick={onCancel}>Cancelar</Button>
          <Button type="primary" htmlType="submit" loading={saving}>
            Guardar
          </Button>
        </ModalActions>
      </Form>
    </Modal>
  );
}
