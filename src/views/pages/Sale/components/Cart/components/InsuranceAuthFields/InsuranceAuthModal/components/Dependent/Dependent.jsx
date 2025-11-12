import { Form, Select, Modal, Input, message, DatePicker, Radio } from 'antd';
import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../../../../../../features/auth/userSlice';
import { selectClient } from '../../../../../../../../../../features/clientCart/clientCartSlice';
import { useInsuranceBeneficiaries, addInsuranceBeneficiary } from '../../../../../../../../../../firebase/insurance/insuranceBeneficiaryService';

import DependentSelector from './DependentSelector';

const Dependent = ({ form }) => {
  const user = useSelector(selectUser);
  const client = useSelector(selectClient);
  const [showNewDependentModal, setShowNewDependentModal] = useState(false);
  const [dependentForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedDependent, setSelectedDependent] = useState(null);
  
  // Cargamos beneficiarios (dependientes) del usuario/cliente actual
  const beneficiaries = useInsuranceBeneficiaries(user, client.id);

  // Validamos las fechas para que no sean del futuro
  const disabledFutureDate = (current) => {
    return current && current > new Date();
  };

  // Effect para actualizar el dependiente seleccionado cuando cambia el formulario
  useEffect(() => {
    const dependentId = form.getFieldValue('dependentId');
    if (dependentId) {
      const found = beneficiaries.find(b => b.id === dependentId);
      setSelectedDependent(found || null);
    } else {
      setSelectedDependent(null);
    }
  }, [form, beneficiaries]);

  const handleAddNewDependent = async () => {
    try {
      setLoading(true);
      const values = await dependentForm.validateFields();
      
      // Formateamos el objeto para simplificar los nombres y añadir fecha ISO
      const formattedValues = {
        name: values.name,
        gender: values.gender,
        birthDate: values.birthDate ? values.birthDate.toISOString() : null,
        relationship: values.relationship
      };
      
      await addInsuranceBeneficiary(user, formattedValues, client?.id);
      message.success('Dependiente agregado exitosamente');
      setShowNewDependentModal(false);
      dependentForm.resetFields();
    } catch (error) {
      console.error('Error al agregar dependiente:', error);
      message.error('Error al agregar dependiente');
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditDependent = (_dependent) => {
    // Implementar edición de dependiente

    // Implementar lógica de edición aquí
  };

  const handleDependentSelect = (dependent) => {
    if (dependent) {
      form.setFieldsValue({ 
        dependentId: dependent.id,
        hasDependent: true  // Actualizamos el valor del checkbox automáticamente
      });
      setSelectedDependent(dependent);
    } else {
      form.setFieldsValue({ 
        dependentId: null,
        hasDependent: false  // Desmarcamos el checkbox si se elimina el dependiente
      });
      setSelectedDependent(null);
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
            message: 'Por favor seleccione un dependiente si aplica'
          }
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
          dependentForm.resetFields();
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
            rules={[{ required: true, message: 'Por favor seleccione el parentesco' }]}
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
            rules={[{ required: true, message: 'Por favor seleccione el sexo' }]}
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
