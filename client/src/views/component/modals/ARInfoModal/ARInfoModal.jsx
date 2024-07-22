import React from 'react';
import styled from 'styled-components';
import * as antd from 'antd';
import { DateTime } from 'luxon';
import { useSelector } from 'react-redux';
import { selectAR } from '../../../../features/accountsReceivable/accountsReceivableSlice';

const {Modal, Descriptions, Tag} = antd;

const StyledModal = styled(Modal)`
  .ant-modal-body {
    max-height: 70vh;
    overflow-y: auto;
  }
`;

const StyledDescriptions = styled(Descriptions)`
  .ant-descriptions-item-label {
    font-weight: bold;
  }
`;

const PaymentMethodTag = styled(Tag)`
  margin-bottom: 5px;
`;

const ARInfoModal = () => {
    const {ar, modalInfo} = useSelector(selectAR)
    const isOpen = modalInfo?.isOpen;
  const formatDate = (milliseconds) => {
    return DateTime.fromMillis(milliseconds).toFormat('dd/MM/yyyy HH:mm');
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);
  };

  return (
    <StyledModal
      title="Información de Cuenta por Cobrar"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={800}
    >
      <StyledDescriptions bordered column={2}>
        <Descriptions.Item label="ID de Cuenta">{arData.arId}</Descriptions.Item>
        <Descriptions.Item label="ID de Factura">{arData.invoiceId}</Descriptions.Item>
        <Descriptions.Item label="ID de Cliente">{arData.clientId}</Descriptions.Item>
        <Descriptions.Item label="Creado">{formatDate(arData.createdAt)}</Descriptions.Item>
        <Descriptions.Item label="Actualizado">{formatDate(arData.updatedAt)}</Descriptions.Item>
        <Descriptions.Item label="Frecuencia de Pago">{arData.paymentFrequency}</Descriptions.Item>
        <Descriptions.Item label="Total Cuotas">{arData.totalInstallments}</Descriptions.Item>
        <Descriptions.Item label="Monto por Cuota">{formatCurrency(arData.installmentAmount)}</Descriptions.Item>
        <Descriptions.Item label="Fecha de Pago">{formatDate(arData.paymentDate)}</Descriptions.Item>
        <Descriptions.Item label="Último Pago">
          {arData.lastPaymentDate ? formatDate(arData.lastPaymentDate) : 'N/A'}
        </Descriptions.Item>
        <Descriptions.Item label="Total por Cobrar">{formatCurrency(arData.totalReceivable)}</Descriptions.Item>
        <Descriptions.Item label="Saldo Actual">{formatCurrency(arData.currentBalance)}</Descriptions.Item>
        <Descriptions.Item label="Balance CxC">{formatCurrency(arData.arBalance)}</Descriptions.Item>
        <Descriptions.Item label="Último Pago">{formatCurrency(arData.lastPayment)}</Descriptions.Item>
        <Descriptions.Item label="Comentarios" span={2}>{arData.comments}</Descriptions.Item>
        <Descriptions.Item label="Creado por">{arData.createdBy}</Descriptions.Item>
        <Descriptions.Item label="Actualizado por">{arData.updatedBy}</Descriptions.Item>
        <Descriptions.Item label="Estado">
          {arData.isClosed ? <Tag color="red">Cerrado</Tag> : <Tag color="green">Abierto</Tag>}
        </Descriptions.Item>
        <Descriptions.Item label="Activo">
          {arData.isActive ? <Tag color="green">Activo</Tag> : <Tag color="red">Inactivo</Tag>}
        </Descriptions.Item>
      </StyledDescriptions>

      <h3 style={{ marginTop: '20px' }}>Métodos de Pago</h3>
      {arData.paymentMethods.map((method, index) => (
        <PaymentMethodTag key={index} color={method.status ? 'green' : 'default'}>
          {method.method}: {formatCurrency(method.value)}
          {method.reference && ` (Ref: ${method.reference})`}
        </PaymentMethodTag>
      ))}
    </StyledModal>
  );
};

export default ARInfoModal;