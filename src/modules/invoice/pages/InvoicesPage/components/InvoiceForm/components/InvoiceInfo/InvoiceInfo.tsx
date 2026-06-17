import {
  faBan,
  faTriangleExclamation,
  faWarehouse,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Modal, Select, Spin, Button, message } from 'antd';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectUser } from '@/features/auth/userSlice';
import { closeInvoiceForm } from '@/features/invoice/invoiceFormSlice';
import { fbCancelInvoice } from '@/firebase/invoices/fbCancelInvoice';
import type { UserIdentity } from '@/types/users';
import type { InvoiceData } from '@/types/invoice';
import {
  DGII_608_REASON_OPTIONS,
  getDgii608ReasonOption,
} from '@/domain/fiscal/dgii608ReasonCatalog';
import { Client } from '../Client/Client';
import { PaymentInfoModal } from '../PaymentInfo/PaymentInfoModal';
import { TimeRemainingBadge } from '../TimeRemainingBadge/TimeRemainingBadge';

import {
  ActionsRow,
  CancelButton,
  Container,
  FormActions,
  ListIcon,
  ModalContent,
  StyledForm,
  StyledFormItem,
  StyledTextArea,
  WarningCard,
  WarningCopy,
  WarningHeader,
  WarningIcon,
  WarningItem,
  WarningList,
  WarningSubtitle,
  WarningTitle,
} from './InvoiceInfo.styles';
import { InvoiceResume } from './components/InvoiceResume';

interface InvoiceInfoProps {
  invoice: InvoiceData;
  isEditLocked?: boolean;
}

const VOIDED_INVOICE_STATUSES = new Set(['voided', 'canceled', 'cancelled']);

const toSafeNumber = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const canRequestInvoiceVoid = (invoice: InvoiceData) => {
  const status =
    typeof invoice.status === 'string' ? invoice.status.toLowerCase() : '';
  const paymentHistory = invoice.paymentHistory;
  const hasPaymentHistory =
    Array.isArray(paymentHistory) && paymentHistory.length > 0;
  const hasAppliedPayment =
    toSafeNumber(invoice.accumulatedPaid) > 0 || hasPaymentHistory;

  return !VOIDED_INVOICE_STATUSES.has(status) && !hasAppliedPayment;
};

export const InvoiceInfo = ({ invoice, isEditLocked }: InvoiceInfoProps) => {
  const [isOpenCancelInvoiceConfirm, setIsOpenCancelInvoiceConfirm] =
    useState(false);
  const [isOpenPaymentInfoModal, setIsOpenPaymentInfoModal] = useState(false);
  const isCancelable = canRequestInvoiceVoid(invoice);

  const handleCloseCancelInvoiceConfirm = () =>
    setIsOpenCancelInvoiceConfirm(false);
  const handleOpenCancelInvoiceConfirm = () =>
    setIsOpenCancelInvoiceConfirm(true);
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
interface CancelInvoiceConfirmProps {
  isOpen: boolean;
  invoice: InvoiceData;
  handleClose: () => void;
}

const CancelInvoiceConfirm = ({
  isOpen,
  invoice,
  handleClose,
}: CancelInvoiceConfirmProps) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserIdentity | null;

  const handleOk = () => {
    setIsLoading(true);
    void form.validateFields().then(
      (values) => {
        const selectedReason = getDgii608ReasonOption(
          values.cancellationReasonCode,
        );
        if (!selectedReason) {
          message.error('Seleccione un motivo DGII válido.');
          setIsLoading(false);
          return;
        }

        return fbCancelInvoice(user, invoice, {
          reasonCode: selectedReason.code,
          reasonLabel: selectedReason.label,
          note: values.cancellationReasonNote,
        }).then(
          () => {
            dispatch(closeInvoiceForm({ clear: true }));
            handleClose();
            message.success('Factura anulada correctamente');
            form.resetFields();
            setIsLoading(false);
          },
          () => {
            message.error('Error al anular factura');
            form.resetFields();
            setIsLoading(false);
          },
        );
      },
      () => {
        message.error('Error al anular factura');
        form.resetFields();
        setIsLoading(false);
      },
    );
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
                <span>
                  Los productos de esta factura volverán al inventario.
                </span>
              </WarningItem>
            </WarningList>
          </WarningCard>

          <StyledForm form={form} layout="vertical" onFinish={handleOk}>
            <StyledFormItem
              label="Motivo de la anulación (DGII 608)"
              name="cancellationReasonCode"
              rules={[
                {
                  required: true,
                  message: 'Seleccione el motivo DGII de la anulación',
                },
              ]}
            >
              <Select
                placeholder="Seleccione el motivo DGII"
                options={DGII_608_REASON_OPTIONS.map((reason) => ({
                  value: reason.code,
                  label: `${reason.code} · ${reason.label}`,
                }))}
              />
            </StyledFormItem>

            <StyledFormItem
              label="Nota interna"
              name="cancellationReasonNote"
              help="Opcional. Contexto adicional para auditoría interna."
            >
              <StyledTextArea
                rows={3}
                placeholder="Detalle interno opcional"
                maxLength={280}
              />
            </StyledFormItem>

            <FormActions>
              <Button onClick={handleCancel}>Cancelar</Button>
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
