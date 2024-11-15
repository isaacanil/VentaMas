import React, { useEffect, useRef, useState } from 'react'
import styled from 'styled-components'
import { Body } from './components/Body/Body'
import { Button, notification, Spin, Form, Modal as AntdModal, message } from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { CancelShipping, SelectCartData, SelectSettingCart, toggleCart, toggleInvoicePanel, toggleInvoicePanelOpen } from '../../../../../features/cart/cartSlice'
import { processInvoice } from '../../../../../services/invoice/invoiceService'
import { selectUser } from '../../../../../features/auth/userSlice'
import { deleteClient, selectClient } from '../../../../../features/clientCart/clientCartSlice'
import { selectAR } from '../../../../../features/accountsReceivable/accountsReceivableSlice'
import { clearTaxReceiptData, selectNcfType, selectTaxReceipt } from '../../../../../features/taxReceipt/taxReceiptSlice'
import { useReactToPrint } from 'react-to-print'
import useViewportWidth from '../../../../../hooks/windows/useViewportWidth'
import { fromMillisToDayjs } from '../../../../../utils/date/convertMillisecondsToDayjs'
import { Invoice } from '../../../Invoice/components/Invoice/Invoice'
import dayjs from 'dayjs' // Add this import

export const modalStyles = {
    mask: {
        backdropFilter: 'blur(2px)',
        display: 'grid',
        overflow: 'hidden'
    },
    content: {
        padding: 0,
        width: '100%',
        height: '100%',
        margin: 0,
        overflowY: 'hidden',
        display: 'grid',
    },
    body: {
        margin: 0,
        padding: '1em',
        overflowY: 'auto'
    }
}

const calculateDueDate = (duePeriod, hasDueDate) => {
    if (!hasDueDate) return null;
    
    const currentDate = dayjs();
    return currentDate
        .add(duePeriod.months || 0, 'month')
        .add(duePeriod.weeks || 0, 'week')
        .add(duePeriod.days || 0, 'day');
}

export const InvoicePanel = () => {
    const dispatch = useDispatch()
    const [form] = Form.useForm()
    const [invoice, setInvoice] = useState({})
    const [submitted, setSubmitted] = useState(false)
    
    const [loading, setLoading] = useState({
        status: false,
        message: ''
    })

    const viewport = useViewportWidth();
    const handleInvoicePanel = () => dispatch(toggleInvoicePanelOpen())
    const cart = useSelector(SelectCartData)
    const cartSettings = useSelector(SelectSettingCart)
    const invoicePanel = cartSettings.isInvoicePanelOpen;
    const shouldPrintInvoice = cartSettings.printInvoice;
    const {duePeriod, hasDueDate} = cartSettings?.billing;
    const componentToPrintRef = useRef();
    const user = useSelector(selectUser)
    const client = useSelector(selectClient)
    const ncfType = useSelector(selectNcfType);
    const accountsReceivable = useSelector(selectAR)
    const { settings: { taxReceiptEnabled } } = useSelector(selectTaxReceipt);
    const total = cart?.payment?.value;
    const isAddedToReceivables = cart?.isAddedToReceivables;
    const change = cart?.change?.value;
    const isChangeNegative = change < 0;
   

    const handlePrint = useReactToPrint({
        content: () => componentToPrintRef.current,
        onAfterPrint: () => {
            setInvoice({});
            handleCancelShipping();
            notification.success({
                message: 'Venta Procesada',
                description: 'La venta ha sido procesada con éxito',
                duration: 4
            })
        }
    })

    const handleCancelShipping = () => {
        if (viewport <= 800) dispatch(toggleCart());
        dispatch(CancelShipping())
        dispatch(clearTaxReceiptData())
        dispatch(deleteClient())
        dispatch(toggleInvoicePanel())
        dispatch(clearTaxReceiptData())
    }

    const showCancelSaleConfirm = () => {
        Modal.confirm({
            title: 'Cancelar Venta',
            content: 'Si cancelas, se perderán todos los datos de la venta actual. ¿Deseas continuar?',
            okText: 'Cancelar Venta',
            zIndex: 999999999999,
            okType: 'danger',
            cancelText: 'Continuar Venta',

            onOk() {
                message.success('Venta cancelada', 2.5)
                handleCancelShipping()
            },
            onCancel() {
                // Aquí manejas el caso en que el usuario decide no cancelar la venta

            },
        });
    };

    async function handleSubmit() {
        try {
            setLoading({ status: true, message: 'Procesando Factura' })
            if (cart?.isAddedToReceivables) {
                await form.validateFields()
            }

            const dueDate = calculateDueDate(duePeriod, hasDueDate);
            
            const { invoice } = await processInvoice({
                cart,
                user,
                client,
                accountsReceivable,
                taxReceiptEnabled,
                ncfType,
                setLoading,
                dispatch,
                dueDate: dueDate?.valueOf(), // Convert to milliseconds
            })

            if (shouldPrintInvoice) {
                setInvoice(invoice)
                setTimeout(() => handlePrint(), 1000)
            }
            if (!shouldPrintInvoice) {
                handleCancelShipping();
                notification.success({
                    message: 'Venta Procesada',
                    description: 'La venta ha sido procesada con éxito',
                    duration: 4
                })
            }
            setLoading({ status: false, message: '' })
            setSubmitted(true)
            
        } catch (error) {
            notification.error({
                message: 'Error de Proceso',
                description: error.message,
                duration: 4
            })
            setLoading({ status: false, message: '' })
            setSubmitted(false)
            console.error('Error processing invoice:', error)
        }
    }

    // const installments = generateInstallments({ ar: accountsReceivable, user })

    useEffect(() => {
        form.setFieldsValue({
            frequency: 'monthly',
            totalInstallments: 1,
            paymentDate: fromMillisToDayjs(Date.now()),
        });
    }, []);
    useEffect(() => {
        form.setFieldsValue({
            ...accountsReceivable,
            paymentDate: fromMillisToDayjs(accountsReceivable?.paymentDate),
        });
    }, [accountsReceivable]);
    useEffect(() => {
        if (!invoicePanel) {
            setSubmitted(false);
        }
    }, [invoicePanel]);
    return (
        <Modal
            style={{ top: 10 }}
            open={invoicePanel}
            title='Pago de Factura'
            onCancel={handleInvoicePanel}
            styles={modalStyles}
            footer={
                [<Button
                    type='default'
                    danger
                    disabled={loading.status || submitted}
                    onClick={showCancelSaleConfirm}
                >
                    Cancelar
                </Button>,
                <Button
                    type='primary'
                    loading={loading.status}
                    disabled={(isChangeNegative && !isAddedToReceivables) || submitted}
                    onClick={handleSubmit}
                >
                    Facturar
                </Button>
                ]
            }
        >
            <Invoice ref={componentToPrintRef} data={invoice} />
            <Spin
                spinning={loading.status}
            >
                <Body
                    form={form}
                />
            </Spin>
        </Modal>
    )
}

export const Modal = styled(AntdModal)`
    .ant-modal-content{
    }
    .ant-modal-header{
        padding: 1em 1em 0;
    }
    .ant-modal-body{
        padding: 1em ;
        /* overflow-y: scroll;    */
    }
    .ant-modal-footer{
        padding: 0 1em 1em;
    }
    padding: 0;

`
