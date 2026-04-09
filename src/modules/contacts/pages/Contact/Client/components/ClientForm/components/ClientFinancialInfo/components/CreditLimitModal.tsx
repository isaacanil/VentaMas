import { Modal, Form, Checkbox, InputNumber, notification, Alert } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { fbUpsertCreditLimit } from '@/firebase/accountsReceivable/fbUpsertCreditLimit';
import type { CreditLimitConfig } from '@/utils/accountsReceivable/types';
import type { UserIdentity } from '@/types/users';

type CreditLimitModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (values: CreditLimitConfig) => void;
  initialValues?: CreditLimitConfig | null;
  client?: { id?: string | null } | null;
  arBalance?: number;
};

type UserRootState = Parameters<typeof selectUser>[0];

const shouldWarnAboutLowAvailableCredit = (
  creditLimit: number,
  arBalance: number,
): boolean => {
  const availableCredit = creditLimit - arBalance;
  return availableCredit > 0 && availableCredit < creditLimit * 0.1;
};

const confirmLowAvailableCredit = (availableCredit: number) => {
  return new Promise<boolean>((resolve) => {
    Modal.confirm({
      title: 'Límite de Crédito Bajo',
      content: `El crédito disponible será muy bajo ($${availableCredit.toLocaleString()}). ¿Estás seguro de que quieres continuar?`,
      okText: 'Sí, continuar',
      cancelText: 'Cancelar',
      onOk: () => resolve(true),
      onCancel: () => resolve(false),
    });
  });
};

const CreditLimitModal = ({
  visible,
  onClose,
  onSave,
  initialValues,
  client,
  arBalance = 0, // Balance de cuentas por cobrar actual
}: CreditLimitModalProps) => {
  const [form] = Form.useForm<CreditLimitConfig>();
  const [loading, setLoading] = useState(false);
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);

  useEffect(() => {
    if (visible && initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [visible, initialValues, form]);

  const handleSave = async () => {
    const values = await form.validateFields().catch((error: unknown) => {
      console.error('Error saving credit limits:', error);
      const typedError = error as { name?: string } | null | undefined;
      if (typedError?.name !== 'ValidationError') {
        notification.error({
          message: 'Error al Guardar',
          description:
            'Hubo un error al guardar los límites de crédito. Por favor, inténtelo de nuevo.',
        });
      }
      return null as CreditLimitConfig | null;
    });

    if (!values) {
      return;
    }

    const creditLimit = values.creditLimit?.value ?? null;
    const creditLimitEnabled = Boolean(values.creditLimit?.status && creditLimit);

    if (creditLimitEnabled && creditLimit < arBalance) {
      notification.warning({
        message: 'Límite de Crédito Insuficiente',
        description: `El límite de crédito ($${creditLimit.toLocaleString()}) no puede ser menor que el balance actual de cuentas por cobrar ($${arBalance.toLocaleString()}). Por favor, ingresa un valor mayor o igual a $${arBalance.toLocaleString()}.`,
      });
      return;
    }

    if (creditLimitEnabled) {
      const availableCredit = creditLimit - arBalance;
      const requiresConfirmation = shouldWarnAboutLowAvailableCredit(
        creditLimit,
        arBalance,
      );

      if (requiresConfirmation) {
        const shouldContinue = await confirmLowAvailableCredit(availableCredit);
        if (!shouldContinue) {
          return;
        }
      }
    }

    setLoading(true);
    let saveError: unknown = null;

    try {
      await fbUpsertCreditLimit({
        user,
        client,
        creditLimitData: values,
      });
    } catch (error) {
      saveError = error;
    }

    setLoading(false);

    if (saveError) {
      console.error('Error saving credit limits:', saveError);
      notification.error({
        message: 'Error al Guardar',
        description:
          'Hubo un error al guardar los límites de crédito. Por favor, inténtelo de nuevo.',
      });
      return;
    }

    notification.success({
      message: 'Límites Actualizados',
      description:
        'Los límites de crédito han sido actualizados exitosamente.',
    });

    onSave(values);
    onClose();
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <StyledModal
      title="Configurar límites de crédito"
      open={visible}
      onCancel={handleCancel}
      onOk={handleSave}
      confirmLoading={loading}
      width={500}
      destroyOnHidden
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          invoice: { status: false, value: null },
          creditLimit: { status: false, value: null },
        }}
      >
        {arBalance > 0 && (
          <Alert
            message="Información del Cliente"
            description={`Balance actual de cuentas por cobrar: $${arBalance.toLocaleString()}. El límite de crédito debe ser mayor o igual a este valor.`}
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <FormSection>
          <Form.Item
            name={['invoice', 'status']}
            valuePropName="checked"
            noStyle
          >
            <Checkbox>Límite de facturas</Checkbox>
          </Form.Item>

          <Form.Item
            name={['invoice', 'value']}
            dependencies={[['invoice', 'status']]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const isEnabled = getFieldValue(['invoice', 'status']);
                  if (isEnabled && (!value || value <= 0)) {
                    return Promise.reject(
                      'Por favor, ingresa un valor válido mayor a cero',
                    );
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <StyledInputNumber
              placeholder="Ingresa el límite de facturas"
              min={1}
              precision={0}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Form.Item>
        </FormSection>

        <FormSection>
          <Form.Item
            name={['creditLimit', 'status']}
            valuePropName="checked"
            noStyle
          >
            <Checkbox>Límite de crédito</Checkbox>
          </Form.Item>

          <Form.Item
            name={['creditLimit', 'value']}
            dependencies={[['creditLimit', 'status']]}
            rules={[
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const isEnabled = getFieldValue(['creditLimit', 'status']);
                  if (isEnabled) {
                    if (!value || value <= 0) {
                      return Promise.reject(
                        'Por favor, ingresa un valor válido mayor a cero',
                      );
                    }
                    if (value < arBalance) {
                      return Promise.reject(
                        `El límite de crédito debe ser mayor o igual al balance actual ($${arBalance.toLocaleString()})`,
                      );
                    }
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <StyledInputNumber
              placeholder="Ingresa el límite de crédito"
              min={0.01}
              precision={2}
              style={{ width: '100%', marginTop: 8 }}
              formatter={(value) =>
                `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
              parser={(value) =>
                value ? value.replace(/\$\s?|(,*)/g, '') : ''
              }
            />
          </Form.Item>
        </FormSection>
      </Form>
    </StyledModal>
  );
};

export default CreditLimitModal;

const StyledModal = styled(Modal)``;

const FormSection = styled.div`
  margin-bottom: 24px;
`;

const StyledInputNumber = styled(InputNumber)`
  &.ant-input-number {
    width: 100%;
  }
`;
