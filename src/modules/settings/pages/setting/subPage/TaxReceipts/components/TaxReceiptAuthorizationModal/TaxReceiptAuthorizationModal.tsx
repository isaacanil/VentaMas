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
import {
  updateTaxReceipt,
  validateSequenceUpdate,
} from '@/firebase/taxReceipt/updateTaxReceipt';
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
  calculateStoredSequenceFromAuthorization,
  buildReceiptOptions,
  calculateNewEndSequence,
  hasBusinessId,
  resolveReceiptIncrease,
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
      message.error('Seleccione una serie antes de registrar el rango.');
      return;
    }

    if (!DateTime.isDateTime(values.expirationDate)) {
      message.error('Seleccione una fecha de vencimiento válida');
      return;
    }

    const receiptData = selectedReceipt.data;
    const sequenceIncrease = resolveReceiptIncrease(receiptData.increase);

    // Calcular la secuencia final
    const endSequence = calculateNewEndSequence(values, sequenceIncrease);
    if (!endSequence) {
      message.error('No se pudo calcular el final del rango.');
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
    const authorizations = receiptData.authorizations ?? [];

    const currentSequence = parseInt(String(receiptData.sequence ?? '0'), 10);
    const newStartSequence = parseInt(String(values.startSequence), 10);
    const storedSequence = calculateStoredSequenceFromAuthorization(
      values.startSequence,
      sequenceIncrease,
    );

    if (storedSequence === null) {
      message.error('La secuencia inicial no es válida para el incremento configurado.');
      return;
    }

    const resolveSequenceLength = () => {
      if (typeof receiptData.sequenceLength === 'number')
        return receiptData.sequenceLength;
      if (receiptData.type === 'B') return 8;
      return 10;
    };

    if (!hasBusinessId(user)) {
      message.error('No se encontró un negocio válido para registrar la secuencia.');
      return;
    }

    if (typeof receiptData.id !== 'string') {
      message.error('No se encontró un comprobante válido para actualizar.');
      return;
    }

    const sequenceValidation = await validateSequenceUpdate(
      user.businessID,
      receiptData.name,
      newStartSequence,
      currentSequence,
      sequenceIncrease,
    );

    if (!sequenceValidation.isValid) {
      message.error(
        sequenceValidation.reason ??
          'La secuencia inicial no es segura para continuar.',
      );
      return;
    }

    const updatedReceipt: TaxReceiptWithAuthorizations = {
      ...receiptData,
      id: receiptData.id,
      sequence: String(storedSequence),
      quantity: String(values.approvedQuantity),
      sequenceLength: resolveSequenceLength(),
      authorizations: [...authorizations, authorizationData],
    };

    try {
      setLoading(true);
      await updateTaxReceipt(user, updatedReceipt);
      setLoading(false);
      message.success('Secuencia registrada correctamente.');
      onAuthorizationAdded(updatedReceipt);
      onCancel();
    } catch (error) {
      setLoading(false);
      console.error('Error al guardar la secuencia autorizada:', error);
      message.error('No se pudo registrar la secuencia autorizada.');
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
          Registrar secuencia
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
              <AuthorizationFields increase={selectedReceipt.data.increase} />
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
