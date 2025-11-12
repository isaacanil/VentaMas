import { faBan, faTriangleExclamation, faWarehouse } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Input, Modal, Spin, Button, message } from 'antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { closeInvoiceForm } from '../../../../../../features/invoice/invoiceFormSlice';
import { fbCancelInvoice } from '../../../../../../firebase/invoices/fbCancelInvoice';
import { Client } from '../Client/Client';
import { InvoiceHeader } from '../InvoiceHeader/InvoiceHeader';
import { PaymentInfoModal } from '../PaymentInfo/PaymentInfoModal';
import { TimeRemainingBadge } from '../TimeRemainingBadge/TimeRemainingBadge';

import { InvoiceResume } from './components/InvoiceResume';

export const InvoiceInfo = ({ invoice, isEditLocked }) => {
  const [isOpenCancelInvoiceConfirm, setIsOpenCancelInvoiceConfirm] = useState(false);
  const [isOpenPaymentInfoModal, setIsOpenPaymentInfoModal] = useState(false);
  const isCancelable = !invoice?.NCF;

  const handleCloseCancelInvoiceConfirm = () => setIsOpenCancelInvoiceConfirm(false);
  const handleOpenCancelInvoiceConfirm = () => setIsOpenCancelInvoiceConfirm(true);
  const handleOpenPaymentInfoModal = () => {
    if (isEditLocked) {
      message.warning('La información de pago es de solo lectura.');
      return;
    }
    setIsOpenPaymentInfoModal(true);
  };
  const handleClosePaymentInfoModal = () => setIsOpenPaymentInfoModal(false);

  return (
    <Container>
      <TimeRemainingBadge invoice={invoice} />
      <InvoiceHeader invoice={invoice} />
      <Client invoice={invoice} isEditLocked={isEditLocked} />
      <InvoiceResume
        invoice={invoice}
        isEditLocked={isEditLocked}
        onOpenPaymentInfo={handleOpenPaymentInfoModal}
      />
      <PaymentInfoModal
        isOpen={isOpenPaymentInfoModal}
        handleClose={handleClosePaymentInfoModal}
        isEditLocked={isEditLocked}
      />
      <ActionsRow>
        <CancelButton
          danger
          disabled={!isCancelable}
          onClick={handleOpenCancelInvoiceConfirm}
        >
          <FontAwesomeIcon icon={faBan} />
          <span>Anular factura</span>
        </CancelButton>
      </ActionsRow>
      <CancelInvoiceConfirm
        isOpen={isOpenCancelInvoiceConfirm}
        invoice={invoice}
        handleClose={handleCloseCancelInvoiceConfirm}
      />
    </Container>
  );
};



const CancelInvoiceConfirm = ({ isOpen, invoice, handleClose }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectUser);

  const handleOk = async () => {
    setIsLoading(true);
    try {
      const values = await form.validateFields();
      const cancellationReason = values.cancellationReason;

      await fbCancelInvoice(user, invoice, cancellationReason);
      dispatch(closeInvoiceForm());
      handleClose();
      message.success('Factura anulada correctamente');
    } catch {
      message.error('Error al anular factura');
    } finally {
      form.resetFields();
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    handleClose();
  };

  return (
    <Modal
      open={isOpen}
      footer={null}
      onCancel={handleCancel}
      destroyOnClose
      centered
    >
      <Spin spinning={isLoading} tip="Cargando..." size="large">
        <ModalContent>
          <WarningCard>
            <WarningHeader>
              <WarningIcon icon={faTriangleExclamation} />
              <WarningCopy>
                <WarningTitle>Confirmación de anulación</WarningTitle>
                <WarningSubtitle>Esta acción es definitiva</WarningSubtitle>
              </WarningCopy>
            </WarningHeader>

            <WarningList>
              <WarningItem>
                <ListIcon icon={faTriangleExclamation} />
                <span>Esta factura se anulará y no se podrá revertir.</span>
              </WarningItem>
              <WarningItem>
                <ListIcon icon={faWarehouse} />
                <span>Los productos de esta factura volverán al inventario.</span>
              </WarningItem>
            </WarningList>
          </WarningCard>

          <StyledForm
            form={form}
            layout="vertical"
            onFinish={handleOk}
          >
            <StyledFormItem
              label="Motivo de la anulación"
              name="cancellationReason"
              help="Ejemplo: El cliente se arrepintió de la compra"
              rules={[{ required: true, message: 'Por favor ingrese el motivo de la anulación' }]}
            >
              <StyledInput
                type="text"
                placeholder="Motivo de la anulación"
              />
            </StyledFormItem>

            <FormActions>
              <Button onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                type="primary"
                danger
                onClick={handleOk}
                icon={<FontAwesomeIcon icon={faBan} />}
              >
                Anular
              </Button>
            </FormActions>
          </StyledForm>
        </ModalContent>
      </Spin>
    </Modal>
  );
};

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const ActionsRow = styled.div`
  display: flex;
  justify-content: flex-end;
`;

const CancelButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const ModalContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const WarningCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 12px;
  background: #fff8eb;
  border: 1px solid #fcd34d;
`;

const WarningHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const WarningIcon = styled(FontAwesomeIcon)`
  font-size: 1.75rem;
  color: #d97706;
`;

const WarningCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const WarningTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  color: #1f2937;
`;

const WarningSubtitle = styled.span`
  font-size: 0.9rem;
  color: #6b7280;
`;

const WarningList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
`;

const WarningItem = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.625rem;
  color: #374151;
`;

const ListIcon = styled(FontAwesomeIcon)`
  margin-top: 0.15rem;
  font-size: 1rem;
  color: #d97706;
`;

const StyledForm = styled(Form)`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const StyledFormItem = styled(Form.Item)`
  margin-bottom: 0;
`;

const StyledInput = styled(Input)`
  padding: 0.6rem 0.75rem;
`;

const FormActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;
