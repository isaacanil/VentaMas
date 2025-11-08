import * as antd from "antd";
import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useReactToPrint } from "react-to-print";
import styled from "styled-components";

import { closePaymentModal, fetchLastInstallmentAmount, selectAccountsReceivablePayment, setPaymentDetails, setPaymentOption, setCreditNotePayment } from "../../../../features/accountsReceivable/accountsReceivablePaymentSlice";
import { selectUser } from "../../../../features/auth/userSlice";
import { selectClient } from "../../../../features/clientCart/clientCartSlice";
import { fbProcessClientPaymentAR } from "../../../../firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR";
import { PAYMENT_OPTIONS, PAYMENT_SCOPE } from "../../../../utils/accountsReceivable/accountsReceivable";
import { AccountsReceivablePaymentReceipt } from "../../../../views/pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt";
import CreditSelector from "../../../pages/Sale/components/Cart/components/InvoicePanel/components/CreditSelector/CreditSelector";
import { Modal, modalStyles } from "../../../pages/Sale/components/Cart/components/InvoicePanel/InvoicePanel";
import { ShowcaseList } from "../../../templates/system/ShowCase/ShowcaseList";

import { PaymentFields } from "./components/PaymentFields";

const { Form, Checkbox, Input, Select, Button, Radio, notification } = antd;
const { Option } = Select;

export const PaymentForm = () => {
    const [form] = Form.useForm();
    const dispatch = useDispatch();
    const user = useSelector(selectUser)
    const componentToPrintRef = useRef();
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [receipt, setReceipt] = useState(null);
    const client = useSelector(selectClient);

    const {
        isOpen,
        paymentDetails,
    } = useSelector(selectAccountsReceivablePayment);

    const selectedCreditNotes = paymentDetails.creditNotePayment || [];

    useEffect(() => {
        if (isOpen && paymentDetails.arId) {
            dispatch(fetchLastInstallmentAmount({ user, arId: paymentDetails.arId }));
        }
    }, [isOpen, user, paymentDetails.arId]);
    
    useEffect(() => {
        if (!isOpen) {
            setSubmitted(false);
        }
    }, [isOpen]);

    const handlePaymentConceptChange = (value) => dispatch(setPaymentOption({ paymentOption: value }));

    // Calculamos el change automáticamente
    const change = (paymentDetails.totalPaid || 0) - paymentDetails.totalAmount;

    const handleCreditNoteSelect = (creditNoteSelections) => {
        dispatch(setCreditNotePayment(creditNoteSelections));
    };

    const validate = () => {
        if (paymentDetails.totalAmount <= 0) {
            throw new Error('El monto total debe ser mayor a cero.');
        }
        // Si es pago de cuota específica ('installment') se debe cubrir el monto completo
        if (paymentDetails.paymentOption === "installment" && paymentDetails.totalPaid < paymentDetails.totalAmount) {
            throw new Error('Debe de pagar el monto total de la cuota seleccionada.');
        }

        const activeMethods = paymentDetails.paymentMethods.filter(method => method.status);
        if (activeMethods.length === 0) {
            throw new Error('Debe seleccionar al menos un método de pago.');
        }

        for (const method of activeMethods) {
            if (method.method !== 'cash' && method.method !== 'creditNote' && !method.reference) {
                throw new Error(`El método de pago ${method.method} requiere una referencia.`);
            }
            if (method.value <= 0) {
                throw new Error(`El valor del método de pago ${method.method} debe ser mayor a cero.`);
            }
        }

        if (paymentDetails.comments.length > 500) {
            throw new Error('Los comentarios no pueden exceder los 500 caracteres.');
        }
    }

    const handleClear = () => {
        dispatch(closePaymentModal());
        form.resetFields();
    };

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        onAfterPrint: () => {
            notification.success({
                message: 'Pago Procesada',
                description: 'Pago Registrado con éxito',
                duration: 4
            })
           handleClear();
        }
    })

    const handleSubmit = async () => {
        setLoading(true);
        try {
            validate();
            await form.validateFields();
            await fbProcessClientPaymentAR(user, paymentDetails, setReceipt);
            setSubmitted(true)

            if (paymentDetails.printReceipt) {
                setTimeout(() => handlePrint(), 1000)
            } else {
                dispatch(closePaymentModal());
                form.resetFields();
            }

        } catch (error) {
            setSubmitted(false)
            if (error.name === 'ValidationError') {
                console.error('Payment form validation failed:', error);
            } else {
                antd.notification.error({
                    message: 'Error al procesar el pago',
                    description: error.message
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
            style={{ top: 10, }}
            title={`${PAYMENT_SCOPE[paymentDetails.paymentScope]}`}
            onCancel={() => dispatch(closePaymentModal())}
            styles={modalStyles}
            footer={[
                <Button key="back" onClick={() => dispatch(closePaymentModal())}>
                    Cancelar
                </Button>,
                <Button key="submit" type="primary" onClick={handleSubmit} loading={loading} disabled={submitted}>
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
                    totalAmountDue: paymentDetails?.totalAmountDue
                }}
            >
                <FormWrapper>
                    {
                        paymentDetails?.paymentScope !== "balance" &&
                        <Select
                            value={paymentDetails.paymentOption}
                            onChange={handlePaymentConceptChange}>
                            {paymentOptions.map(concept => (
                                <Option key={concept.name} value={concept.name}>
                                    {concept.text}
                                </Option>
                            ))}
                        </Select>
                    }
                      {
                        (paymentDetails.paymentOption == "partial") && (
                            <ShowcaseList
                                showcases={[
                                    {
                                        title: "Balance de la cuenta Actual" ,
                                        valueType: "price",
                                        description: "Se aplicara el pago a las diferentes cuotas de la cuenta actual",
                                        value: paymentDetails.totalAmount,
                                    },
                                ]}
                            />
                        )
                    }
                    {
                        !(paymentDetails.paymentOption == "partial") && (
                            <ShowcaseList
                                showcases={[
                                    {
                                        title: paymentDetails.paymentScope == "balance" ? "Balance General" : "Total a pagar",
                                        valueType: "price",
                                        description: paymentDetails.paymentScope == "balance" ? "Se aplicara el pago a las diferentes cuentas por cobrar del cliente actual" : "Total a pagar por el cliente",
                                        value: paymentDetails.totalAmount,
                                    },
                                ]}
                            />
                        )
                    }

                    <PaymentFields />

                    {/* Selector de notas de crédito */}
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
                                title: "Total pagado",
                                valueType: "price",
                                value: paymentDetails.totalPaid,
                            },
                            {
                                title: change >= 0 ? "Devuelta" : "Faltante",
                                valueType: "price",
                                value: change,
                                description: (paymentDetails.paymentOption == "installment" || paymentDetails.paymentOption == "balance") ? "Tiene que pagar completamente" : "No tiene que pagar el faltante completamente",
                                color: (paymentDetails.paymentOption == "installment" || paymentDetails.paymentOption == "balance") ? paymentDetails.totalAmount >= paymentDetails.totalPaid : null
                            },
                        ]}
                    />
                    
                    <Form.Item>
                        <Checkbox
                            checked={paymentDetails.printReceipt}
                            onChange={(e) => dispatch(setPaymentDetails({ printReceipt: e.target.checked }))}
                        >
                            Imprimir recibo de pago
                        </Checkbox>
                    </Form.Item>
                </FormWrapper>
            </Form>
            
            <div style={{ display: 'none' }}>
                <AccountsReceivablePaymentReceipt data={receipt} ref={componentToPrintRef} />
            </div>
        </Modal>
    );
};

const FormWrapper = styled.div`
    display: grid;
    gap: 1em;
`;
