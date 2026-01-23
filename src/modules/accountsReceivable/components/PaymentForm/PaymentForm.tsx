import { Form, Checkbox, Select, Button, notification } from 'antd';
import type { FormInstance } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import {
  closePaymentModal,
  fetchLastInstallmentAmount,
  selectAccountsReceivablePayment,
  setPaymentDetails,
  setPaymentOption,
  setCreditNotePayment,
} from '@/features/accountsReceivable/accountsReceivablePaymentSlice';
import { selectUser } from '@/features/auth/userSlice';
import { selectClient } from '@/features/clientCart/clientCartSlice';
import { fbProcessClientPaymentAR } from '@/firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR';
import {
  PAYMENT_OPTIONS,
  PAYMENT_SCOPE,
} from '@/utils/accountsReceivable/accountsReceivable';
import { AccountsReceivablePaymentReceipt } from '@/modules/checkout/pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt';
import CreditSelector from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/components/CreditSelector/CreditSelector';
import { modalStyles } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/constants/modalStyles';
import { Modal } from '@/modules/sales/pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel';
import { ShowcaseList } from '@/components/ui/ShowCase/ShowcaseList';
import type { CreditNoteSelection } from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';
import type { AccountsReceivablePaymentReceipt as AccountsReceivablePaymentReceiptData } from '@/utils/accountsReceivable/types';

import { PaymentFields } from './components/PaymentFields';

const { Option } = Select;

type AccountsReceivablePaymentRootState = Parameters<
  typeof selectAccountsReceivablePayment
>[0];
type UserRootState = Parameters<typeof selectUser>[0];
type ClientRootState = Parameters<typeof selectClient>[0];

type AccountsReceivablePaymentMethod = {
  method: string;
  value: number;
  status: boolean;
  reference?: string;
  name?: string;
};

type PaymentDetails = {
  paymentScope: string;
  paymentOption: string;
  clientId: string;
  arId?: string;
  paymentMethods: AccountsReceivablePaymentMethod[];
  comments: string;
  totalAmount: number;
  totalPaid: number;
  totalAmountDue?: number;
  printReceipt: boolean;
  creditNotePayment?: CreditNoteSelection[];
};

type AccountsReceivablePaymentState =
  ReturnType<typeof selectAccountsReceivablePayment> & {
    paymentDetails: PaymentDetails;
  };

type ClientSummary = {
  id?: string;
  name?: string;
  tel?: string;
  address?: string;
  personalID?: string;
  delivery?: {
    status?: boolean;
    value?: number;
  };
} & Record<string, unknown>;

type FormValidationError = {
  errorFields?: unknown[];
  message?: string;
};

export const PaymentForm = () => {
  const [form] = Form.useForm() as [FormInstance];
  const dispatch = useDispatch();
  const user = useSelector<UserRootState, UserIdentity | null>(selectUser);
  const componentToPrintRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [receipt, setReceipt] =
    useState<AccountsReceivablePaymentReceiptData | null>(null);
  const client = useSelector<ClientRootState, ClientSummary>(selectClient);
  const [printPending, setPrintPending] = useState(false);

  const { isOpen, paymentDetails } = useSelector<
    AccountsReceivablePaymentRootState,
    AccountsReceivablePaymentState
  >(selectAccountsReceivablePayment);

  const selectedCreditNotes: CreditNoteSelection[] =
    paymentDetails.creditNotePayment || [];

  const handlePrint = useReactToPrint({
    contentRef: componentToPrintRef,
    onAfterPrint: () => {
      notification.success({
        message: 'Pago Procesada',
        description: 'Pago registrado e impreso con Ã©xito',
        duration: 4,
      });
      handleClear();
    },
  });

  // Este efecto reemplaza al setTimeout.
  // Solo se ejecuta cuando hay un recibo cargado Y se solicitÃ³ impresiÃ³n.
  useEffect(() => {
    if (printPending && receipt) {
      handlePrint();
      setPrintPending(false); // Reseteamos la bandera para evitar impresiones dobles
    }
  }, [receipt, printPending, handlePrint]);

  useEffect(() => {
    if (isOpen && paymentDetails.arId) {
      dispatch(
        fetchLastInstallmentAmount({
          user: user as UserIdentity,
          arId: paymentDetails.arId,
        }),
      );
    }
  }, [isOpen, user, paymentDetails.arId, dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setSubmitted(false);
    }
  }, [isOpen]);

  const handlePaymentConceptChange = (value: string) =>
    dispatch(setPaymentOption({ paymentOption: value }));

  // Calculamos el change automÃ¡ticamente
  const change = (paymentDetails.totalPaid || 0) - paymentDetails.totalAmount;

  const handleCreditNoteSelect = (
    creditNoteSelections: CreditNoteSelection[],
  ) => {
    dispatch(setCreditNotePayment(creditNoteSelections));
  };

  const validate = () => {
    if (paymentDetails.totalAmount <= 0) {
      throw new Error('El monto total debe ser mayor a cero.');
    }
    // Si es pago de cuota especÃ­fica ('installment') se debe cubrir el monto completo
    if (
      paymentDetails.paymentOption === 'installment' &&
      paymentDetails.totalPaid < paymentDetails.totalAmount
    ) {
      throw new Error('Debe de pagar el monto total de la cuota seleccionada.');
    }

    const activeMethods = paymentDetails.paymentMethods.filter(
      (method) => method.status,
    );
    if (activeMethods.length === 0) {
      throw new Error('Debe seleccionar al menos un mÃ©todo de pago.');
    }

    for (const method of activeMethods) {
      if (
        method.method !== 'cash' &&
        method.method !== 'creditNote' &&
        !method.reference
      ) {
        throw new Error(
          `El mÃ©todo de pago ${method.method} requiere una referencia.`,
        );
      }
      if (method.value <= 0) {
        throw new Error(
          `El valor del mÃ©todo de pago ${method.method} debe ser mayor a cero.`,
        );
      }
    }

    if (paymentDetails.comments.length > 500) {
      throw new Error('Los comentarios no pueden exceder los 500 caracteres.');
    }
  };

  const handleClear = () => {
    dispatch(closePaymentModal());
    form.resetFields();
  };



  const handleSubmit = async () => {
    setLoading(true);
    try {
      validate();
      await form.validateFields();

      await fbProcessClientPaymentAR(
        user as UserIdentity,
        paymentDetails as PaymentDetails,
        setReceipt,
      );
      setSubmitted(true);

      if (paymentDetails.printReceipt) {
        setPrintPending(true);
      } else {
        notification.success({
          message: 'Pago Procesado',
          description: 'Pago registrado con Ã©xito',
        });
        handleClear();
      }
    } catch (error) {
      setSubmitted(false);
      const typedError = error as FormValidationError | Error;
      if (
        typedError &&
        typeof typedError === 'object' &&
        'errorFields' in typedError &&
        Array.isArray(typedError.errorFields)
      ) {
        console.error('Payment form validation failed:', typedError);
        notification.warning({
          message: 'Campos requeridos',
          description: 'Por favor complete los campos obligatorios marcados en rojo.',
        });
      } else {
        const errorMessage =
          typedError instanceof Error
            ? typedError.message
            : typedError?.message || 'Ocurrió un error desconocido';
        notification.error({
          message: 'Error al procesar el pago',
          description: errorMessage,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const paymentOptions = Object.values(PAYMENT_OPTIONS);

  return (
    <Modal
      open={isOpen}
      style={{ top: 10 }}
      title={`${
        PAYMENT_SCOPE[
          paymentDetails.paymentScope as keyof typeof PAYMENT_SCOPE
        ] ?? paymentDetails.paymentScope
      }`}
      onCancel={() => dispatch(closePaymentModal())}
      styles={modalStyles}
      footer={[
        <Button key="back" onClick={() => dispatch(closePaymentModal())}>
          Cancelar
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={submitted}
        >
          Pagar
        </Button>,
      ]}
      zIndex={2000}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          paymentConcept: paymentDetails?.paymentScope,
          totalAmountDue: paymentDetails?.totalAmountDue,
        }}
      >
        <FormWrapper>
          {paymentDetails?.paymentScope !== 'balance' && (
            <Select
              value={paymentDetails.paymentOption}
              onChange={handlePaymentConceptChange}
            >
              {paymentOptions.map((concept) => (
                <Option key={concept.name} value={concept.name}>
                  {concept.text}
                </Option>
              ))}
            </Select>
          )}
          {paymentDetails.paymentOption == 'partial' && (
            <ShowcaseList
              showcases={[
                {
                  title: 'Balance de la cuenta Actual',
                  valueType: 'price',
                  description:
                    'Se aplicara el pago a las diferentes cuotas de la cuenta actual',
                  value: paymentDetails.totalAmount,
                },
              ]}
            />
          )}
          {!(paymentDetails.paymentOption == 'partial') && (
            <ShowcaseList
              showcases={[
                {
                  title:
                    paymentDetails.paymentScope == 'balance'
                      ? 'Balance General'
                      : 'Total a pagar',
                  valueType: 'price',
                  description:
                    paymentDetails.paymentScope == 'balance'
                      ? 'Se aplicara el pago a las diferentes cuentas por cobrar del cliente actual'
                      : 'Total a pagar por el cliente',
                  value: paymentDetails.totalAmount,
                },
              ]}
            />
          )}

          <PaymentFields />

          {/* Selector de notas de crÃ©dito */}
          {client?.id && client.id !== 'GC-0000' && (
            <CreditSelector
              clientId={client.id}
              onCreditNoteSelect={handleCreditNoteSelect}
              selectedCreditNotes={selectedCreditNotes}
              totalPurchase={paymentDetails.totalAmount}
              paymentMethods={paymentDetails.paymentMethods}
            />
          )}

          <ShowcaseList
            showcases={[
              {
                title: 'Total pagado',
                valueType: 'price',
                value: paymentDetails.totalPaid,
              },
              {
                title: change >= 0 ? 'Devuelta' : 'Faltante',
                valueType: 'price',
                value: change,
                description:
                  paymentDetails.paymentOption == 'installment' ||
                    paymentDetails.paymentOption == 'balance'
                    ? 'Tiene que pagar completamente'
                    : 'No tiene que pagar el faltante completamente',
                color:
                  paymentDetails.paymentOption === 'installment' ||
                  paymentDetails.paymentOption === 'balance',
              },
            ]}
          />

          <Form.Item>
            <Checkbox
              checked={paymentDetails.printReceipt}
              onChange={(e) =>
                dispatch(setPaymentDetails({ printReceipt: e.target.checked }))
              }
            >
              Imprimir recibo de pago
            </Checkbox>
          </Form.Item>
        </FormWrapper>
      </Form>

      <div style={{ display: 'none' }}>
        {receipt && (
          <AccountsReceivablePaymentReceipt
            data={receipt}
            ref={componentToPrintRef}
          />
        )}
      </div>
    </Modal>
  );
};

const FormWrapper = styled.div`
  display: grid;
  gap: 1em;
`;



