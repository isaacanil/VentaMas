import {
  CheckCircleOutlined,
} from '@/constants/icons/antd';
import {
  Modal,
  Form,
  Button,
  message,
} from 'antd';
import { DateTime } from 'luxon';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { updateTaxReceipt } from '@/firebase/taxReceipt/updateTaxReceipt';
import { AuthorizationFields } from './components/AuthorizationFields';
import { ModalHeader } from './components/ModalHeader';
import { ReceiptSelectField } from './components/ReceiptSelectField';
import { SelectedReceiptDetails } from './components/SelectedReceiptDetails';
import type {
  AuthorizationFormValues,
  TaxReceiptAuthorizationModalProps,
  TaxReceiptWithAuthorizations,
} from './types';
import {
  buildDefaultExpirationDate,
  buildReceiptOptions,
  calculateNewEndSequence,
  hasBusinessId,
} from './utils/taxReceiptAuthorizationModal';

const TaxReceiptAuthorizationModal = ({
  visible,
  onCancel,
  taxReceipts,
  onAuthorizationAdded,
}: TaxReceiptAuthorizationModalProps) => {
  const [form] = Form.useForm<AuthorizationFormValues>();
  const user = useSelector(selectUser);
  const [selectedReceipt, setSelectedReceipt] =
    useState<
      TaxReceiptAuthorizationModalProps['taxReceipts'] extends (infer T)[]
        ? T | null
        : null
    >(null);
  const [loading, setLoading] = useState(false);

  const activeReceipts = buildReceiptOptions(taxReceipts);

  const handleReceiptSelect = (receiptId?: string) => {
    const receipt = (taxReceipts ?? []).find(
      (item) => item.id === receiptId || item.data.id === receiptId,
    );
    const expirationDate = buildDefaultExpirationDate();

    setSelectedReceipt(receipt ?? null);
    form.setFieldsValue({
      authorizationNumber: '',
      requestNumber: '',
      startSequence: '',
      approvedQuantity: '',
      expirationDate,
    });
  };

  const handleSave = async () => {
    const values = await form.validateFields();

    if (!selectedReceipt) {
      message.error('Por favor seleccione un comprobante');
      setLoading(false);
      return;
    }

    if (!DateTime.isDateTime(values.expirationDate)) {
      message.error('Seleccione una fecha de vencimiento válida');
      setLoading(false);
      return;
    }

    // Calcular la secuencia final
    const endSequence = calculateNewEndSequence(values);
    if (!endSequence) {
      message.error('Error al calcular la secuencia final');
      setLoading(false);
      return;
    }

    // Crear el objeto de autorización
    const authorizationData = {
      authorizationNumber: values.authorizationNumber,
      requestNumber: values.requestNumber,
      startSequence: String(values.startSequence),
      endSequence: String(endSequence),
      approvedQuantity: String(values.approvedQuantity),
      expirationDate: values.expirationDate.toFormat('yyyy-MM-dd'),
      authorizationDate: DateTime.now().toFormat('yyyy-MM-dd'),
    };
    const receiptData = selectedReceipt.data;
    const authorizations = receiptData.authorizations ?? [];

    const currentSequence = parseInt(String(receiptData.sequence ?? '0'), 10);
    const newStartSequence = parseInt(String(values.startSequence), 10);

    if (newStartSequence < currentSequence) {
      message.error(
        `Error: La secuencia inicial (${newStartSequence}) no puede ser menor que la secuencia actual (${currentSequence}). Esto podría causar duplicación de NCF.`,
      );
      setLoading(false);
      return;
    }

    const resolveSequenceLength = () => {
      if (typeof receiptData.sequenceLength === 'number')
        return receiptData.sequenceLength;
      if (receiptData.type === 'B') return 8;
      return 10;
    };

    if (!hasBusinessId(user)) {
      message.error('No se encontró un negocio válido para registrar la autorización.');
      return;
    }

    if (typeof receiptData.id !== 'string') {
      message.error('No se encontró un comprobante válido para actualizar.');
      return;
    }

    const updatedReceipt: TaxReceiptWithAuthorizations = {
      ...receiptData,
      id: receiptData.id,
      sequence:
        newStartSequence > currentSequence
          ? String(values.startSequence)
          : receiptData.sequence,
      quantity:
        newStartSequence > currentSequence
          ? String(values.approvedQuantity)
          : receiptData.quantity,
      sequenceLength: resolveSequenceLength(),
      authorizations: [...authorizations, authorizationData],
    };

    try {
      setLoading(true);
      await updateTaxReceipt(user, updatedReceipt);
      setLoading(false);
      message.success('Autorización registrada correctamente');
      onAuthorizationAdded(updatedReceipt);
      onCancel();
    } catch (error) {
      setLoading(false);
      console.error('Error al guardar la autorización:', error);
      message.error('Error al registrar la autorización del comprobante');
    }
  };

  return (
    <Modal
      title={
        <ModalHeader />
      }
      open={visible}
      onCancel={onCancel}
      afterOpenChange={(open) => {
        if (open) return;
        form.resetFields();
        setSelectedReceipt(null);
      }}
      width={700}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSave}
          loading={loading}
          icon={<CheckCircleOutlined />}
          disabled={!selectedReceipt}
        >
          Registrar Autorización
        </Button>,
      ]}
      destroyOnHidden
    >
      <Container>
        <Form form={form} layout="vertical" name="authorizationForm">
          <ReceiptSelectField
            activeReceipts={activeReceipts}
            onReceiptSelect={handleReceiptSelect}
          />

          {selectedReceipt && (
            <>
              <SelectedReceiptDetails receipt={selectedReceipt} />
              <AuthorizationFields />
            </>
          )}
        </Form>
      </Container>
    </Modal>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

export default TaxReceiptAuthorizationModal;
