import { Form, Select, Modal, Input, message, DatePicker, Radio } from 'antd';
import type { FormInstance } from 'antd';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import {
  useInsuranceBeneficiaries,
  addInsuranceBeneficiary,
} from '@/firebase/insurance/insuranceBeneficiaryService';

import DependentSelector from './DependentSelector';

type UserIdentity = {
  businessID?: string;
  uid?: string;
};

type ClientIdentity = {
  id?: string;
  name?: string;
};

type DependentRecord = {
  id: string;
  name?: string;
  gender?: string;
  relationship?: string;
  birthDate?: string | null;
  [key: string]: unknown;
};

type DependentProps = {
  form: FormInstance;
  hasDependent?: boolean;
  onDependentChange?: (nextValue: boolean) => void;
};

type DateLike = { valueOf: () => number } | null;

const Dependent = ({ form, onDependentChange }: DependentProps) => {
  const user = useSelector(selectUser) as UserIdentity;
  const client = useSelector(selectClient) as ClientIdentity | null;
  const [showNewDependentModal, setShowNewDependentModal] = useState(false);
  const [dependentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Cargamos beneficiarios (dependientes) del usuario/cliente actual
  const beneficiaries = useInsuranceBeneficiaries(
    user,
    client?.id,
  ) as DependentRecord[];
  const dependentId = Form.useWatch('dependentId', form) as string | null;
  const selectedDependent = useMemo(() => {
    if (!dependentId) return null;
    return (
      beneficiaries.find((beneficiary) => beneficiary.id === dependentId) ||
      null
    );
  }, [beneficiaries, dependentId]);

  // Validamos las fechas para que no sean del futuro
  const disabledFutureDate = (current: DateLike) =>
    !!current && current.valueOf() > Date.now();

  const handleAddNewDependent = () => {
    setLoading(true);
    void dependentForm.validateFields().then(
      (values) => {
        // Formateamos el objeto para simplificar los nombres y añadir fecha ISO
        const formattedValues: Partial<DependentRecord> = {
          name: values.name as string | undefined,
          gender: values.gender as string | undefined,
          birthDate: values.birthDate ? values.birthDate.toISOString() : null,
          relationship: values.relationship as string | undefined,
        };

        return addInsuranceBeneficiary(user, formattedValues, client?.id).then(
          () => {
            message.success('Dependiente agregado exitosamente');
            setShowNewDependentModal(false);
            dependentForm.resetFields([]);
            setLoading(false);
          },
          (error) => {
            console.error('Error al agregar dependiente:', error);
            message.error('Error al agregar dependiente');
            setLoading(false);
          },
        );
      },
      (error) => {
        console.error('Error al agregar dependiente:', error);
        message.error('Error al agregar dependiente');
        setLoading(false);
      },
    );
  };

  const handleEditDependent = (_dependent: DependentRecord) => {
    // Implementar edición de dependiente
    // Implementar lógica de edición aquí
  };

  const handleDependentSelect = (dependent: DependentRecord | null) => {
    if (dependent) {
      form.setFieldsValue({
        dependentId: dependent.id,
        hasDependent: true, // Actualizamos el valor del checkbox automáticamente
      });
      onDependentChange?.(true);
    } else {
      form.setFieldsValue({
        dependentId: null,
        hasDependent: false, // Desmarcamos el checkbox si se elimina el dependiente
      });
      onDependentChange?.(false);
    }
  };

  return (
    <>
      <Form.Item
        label="Para dependiente"
        name="dependentId"
        rules={[
          {
            required: false,
            message: 'Por favor seleccione un dependiente si aplica',
          },
        ]}
        hidden
      />

      <DependentSelector
        dependents={beneficiaries}
        selectedDependent={selectedDependent}
        onSelectDependent={handleDependentSelect}
        onAddDependent={() => setShowNewDependentModal(true)}
        onEditDependent={handleEditDependent}
        validateStatus={form.getFieldError('dependentId') ? 'error' : ''}
        help={form.getFieldError('dependentId')?.[0]}
      />

      {/* Modal para nuevo dependiente */}
      <Modal
        title="Nuevo Dependiente"
        open={showNewDependentModal}
        onCancel={() => {
          setShowNewDependentModal(false);
          dependentForm.resetFields([]);
        }}
        onOk={handleAddNewDependent}
        confirmLoading={loading}
      >
        <Form form={dependentForm} layout="vertical">
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: 'Por favor ingrese el nombre' }]}
          >
            <Input autoComplete="off" />
          </Form.Item>

          <Form.Item
            name="birthDate"
            label="Fecha de Nacimiento (opcional)"
            rules={[{ required: false }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              autoComplete="off"
              format="DD/MM/YYYY"
              disabledDate={disabledFutureDate}
              placeholder="Seleccionar fecha (opcional)"
            />
          </Form.Item>

          <Form.Item
            name="relationship"
            label="Parentesco"
            rules={[
              { required: true, message: 'Por favor seleccione el parentesco' },
            ]}
          >
            <Select placeholder="Seleccione el parentesco">
              <Select.Option value="child">Hijo/a</Select.Option>
              <Select.Option value="spouse">Cónyuge</Select.Option>
              <Select.Option value="father">Padre</Select.Option>
              <Select.Option value="mother">Madre</Select.Option>
              <Select.Option value="other">Otro</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="gender"
            label="Sexo"
            rules={[
              { required: true, message: 'Por favor seleccione el sexo' },
            ]}
          >
            <Radio.Group>
              <Radio value="M">Masculino</Radio>
              <Radio value="F">Femenino</Radio>
            </Radio.Group>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default Dependent;
