import * as antd from "antd";
import { useEffect, useRef, useState } from "react";
import { closePaymentModal, fetchLastInstallmentAmount, selectAccountsReceivablePayment, setPaymentDetails, setPaymentOption } from "../../../../features/accountsReceivable/accountsReceivablePaymentSlice";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import { ShowcaseList } from "../../../templates/system/Showcase/ShowcaseList";
import { Modal, modalStyles } from "../../cart/components/InvoicePanel/InvoicePanel";
import { PaymentFields } from "./components/PaymentFields";
import { PAYMENT_OPTIONS, PAYMENT_SCOPE } from "../../../../utils/accountsReceivable/accountsReceivable";
import { fbProcessClientPaymentAR } from "../../../../firebase/proccessAccountsReceivablePayments/fbProccessClientPaymentAR";
import { selectUser } from "../../../../features/auth/userSlice";
import { selectClient } from "../../../../features/clientCart/clientCartSlice";
import { AccountsReceivablePaymentReceipt } from "../../../../views/pages/checkout/receipts/AccountsReceivablePaymentReceipt/AccountsReceivablePaymentReceipt";
import { useReactToPrint } from "react-to-print";
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

    const {
        isOpen,
        paymentDetails,
    } = useSelector(selectAccountsReceivablePayment);

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

    const handleAmountChange = (changedValues, allValues) => {
        const { paymentMethods } = paymentDetails; // Obtener paymentMethods del estado
        const cashMethod = allValues['cash']
        const updatedPaymentMethods = paymentMethods.map(paymentMethod => {
            // Verificar si el método de pago es 'cash'
            const isCash = paymentMethod.method === 'cash';

            // Obtener el valor del método de pago del objeto allValues
            const paymentValue = Number(allValues[paymentMethod.method]) || 0;

            // Obtener la referencia del método de pago del objeto allValues, si no es 'cash'
            let reference;
            if (!isCash) {
                reference = allValues[`${paymentMethod.method}Reference`] || paymentMethod.reference;
            }

            // Obtener el estado del método de pago del objeto allValues
            const status = typeof allValues[paymentMethod.method] === 'boolean' ?
                allValues[paymentMethod.method] :
                paymentMethod.status;

            // Crear un nuevo objeto actualizado con los valores calculados
            const updatedMethod = {
                ...paymentMethod,  // Mantener todas las propiedades originales del método de pago
                value: paymentValue,  // Establecer el valor del método de pago
                ...(reference && { reference }),  // Incluir la referencia si existe y no es 'cash'
                status: status  // Establecer el estado del método de pago
            };

            return updatedMethod;
        });


        const totalPaid = updatedPaymentMethods.reduce((total, pm) => {
            if (pm.status) {
                return total + (Number(pm.value) || 0);
            }
            return total;
        }, 0);

        dispatch(setPaymentDetails({
            paymentMethods: updatedPaymentMethods,
            totalPaid
        }));
    };
    const validate = () => {
        if (paymentDetails.totalAmount <= 0) {
            throw new Error('El monto total debe ser mayor a cero.');
        }
        if (paymentDetails.paymentOptions === "balance" || paymentDetails.paymentOptions === "installment") {
            if (paymentDetails.totalPaid < paymentDetails.totalAmount) {
                throw new Error('Debe de pagar el monto total');
            }
        }

        // Validar métodos de pago
        const activeMethods = paymentDetails.paymentMethods.filter(method => method.status);
        if (activeMethods.length === 0) {
            throw new Error('Debe seleccionar al menos un método de pago.');
        }

        for (const method of activeMethods) {
            if (method.method !== 'cash' && !method.reference) {
                throw new Error(`El método de pago ${method.method} requiere una referencia.`);
            }
            if (method.value <= 0) {
                throw new Error(`El valor del método de pago ${method.method} debe ser mayor a cero.`);
            }
        }

        // Validar longitud de comentarios
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
                console.log("receipt => ", receipt)
                setTimeout(() => handlePrint(), 1000)
            } else {
                dispatch(closePaymentModal());
                form.resetFields();
            }

        } catch (error) {
            setSubmitted(false)
            if (error.name === 'ValidationError') {
                console.log('Validate Failed:', error);
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
    const change = (paymentDetails.totalPaid || 0) - paymentDetails.totalAmount

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
                onValuesChange={handleAmountChange}
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

                    <PaymentFields
                        handleAmountChange={handleAmountChange}
                    />
                    <ShowcaseList
                        showcases={[
                            {
                                title: "Total pagado",
                                valueType: "price",
                                value: paymentDetails.totalPaid,
                            },
                            {
                                title: change > 0 ? "Devuelta" : "Faltante",
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
            <div   >
                <AccountsReceivablePaymentReceipt data={receipt} ref={componentToPrintRef} />
            </div>
        </Modal>
    );
};

const FormWrapper = styled.div`
    display: grid;
    gap: 1em;
`;
