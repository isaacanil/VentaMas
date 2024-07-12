
import React, { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components'
import * as antd from 'antd'
import { useDispatch, useSelector } from 'react-redux'
import { SelectCartData, toggleReceivableStatus } from '../../../../../../../../../features/cart/cartSlice'
import { calculateInvoiceChange } from '../../../../../../../../../utils/invoice';
import { useFormatPrice } from '../../../../../../../../../hooks/useFormatPrice';
import { selectAR, setAR } from '../../../../../../../../../features/accountsReceivable/accountsReceivableSlice';
import { AnimatePresence, motion } from 'framer-motion';
import { calculateAmountPerInstallment, calculateRemainingBalance } from '../../../../../../../../../utils/accountsReceivable/accountsReceivable';
import usePaymentDates from './usePaymentDates';
import { fromMillisToDayjs } from '../../../../../../../../../utils/date/convertMillisecondsToDayjs';
import { setNumPrecision } from '../../../../../../../../../utils/pricing';
import { getMaxInstallments } from '../../../../../../../../../utils/accountsReceivable/getMaxInstallments';
import { fbGetPendingBalance } from '../../../../../../../../../firebase/accountsReceivable/fbGetPendingBalance';
import { selectClient } from '../../../../../../../../../features/clientCart/clientCartSlice';
import { selectUser } from '../../../../../../../../../features/auth/userSlice';

const { DatePicker, Input, InputNumber, Select, Button, Form } = antd;
const { Option } = Select;
const { TextArea } = Input;

export const ReceivableManagementPanel = ({ form, creditLimit }) => {
    const dispatch = useDispatch();
    const user = useSelector(selectUser)
    const [generalBalance, setGeneralBalance] = useState("")
    const {
        paymentFrequency,
        totalInstallments,
        installmentAmount,
        currentBalance,
        paymentDate,
        totalReceivable,
        comments
    } = useSelector(selectAR)

    const cartData = useSelector(SelectCartData);
    const client = useSelector(selectClient)
    const receivableStatus = cartData.isAddedToReceivables;
    const change = useMemo(() => calculateInvoiceChange(cartData), [cartData]);
    const payment = cartData?.payment?.value || 0;
    const isChangeNegative = change < 0;
    const isReceivable = receivableStatus && isChangeNegative;
    const maxInstallments = getMaxInstallments(paymentFrequency);
    const containerVariants = {
        hidden: {
            opacity: 0,
            scaleY: 0.10,
            height: 0,
            transition: { duration: 0.3 }
        },
        visible: {
            opacity: 1,
            scaleY: 1,
            height: 'auto',
            transition: { duration: 0.5 }
        },
    };
    const isValidClient = !client.id || client.id == "GC-0000"

    const getPositive = (value) => value < 0 ? value * -1 : value;

    const { nextPaymentDate } = usePaymentDates(paymentFrequency, totalInstallments)

    const setFrequency = value => dispatch(setAR({ paymentFrequency: value }))
    const setInstallments = value => dispatch(setAR({ totalInstallments: Number(value) || "" }))
    const setPaymentDate = value => dispatch(setAR({ paymentDate: value }))
    const setAmountPerInstallment = value => dispatch(setAR({ installmentAmount: getPositive(setNumPrecision(value)) }))
    const setComments = value => dispatch(setAR({ comments: value }))
    const setCurrentBalance = value => dispatch(setAR({ currentBalance: value }))
    const setTotalReceivable = value => dispatch(setAR({ totalReceivable: value }))

    useEffect(() => {
        setAmountPerInstallment(calculateAmountPerInstallment(change, totalInstallments))
    }, [totalInstallments, change])

    useEffect(() => {
        setGeneralBalance(getPositive(change) + currentBalance)
    }, [currentBalance, change])

    useEffect(() => {
        setTotalReceivable(getPositive(change))
    }, [change, totalInstallments, ])

    useEffect(() => {
        setPaymentDate(nextPaymentDate)
    }, [paymentFrequency, totalInstallments])

    useEffect(() => {
        const fetchPendingBalance = async () => {
            const unsubscribe = fbGetPendingBalance(user?.businessID, client?.id, setCurrentBalance)
            return () => unsubscribe()
        };
        fetchPendingBalance();
    }, [client, isReceivable, user])

    useEffect(() => {
        if (client.id == "GC-0000" || !client.id) {
            dispatch(toggleReceivableStatus(false))
        }
    }, [client])

    return (
        <AnimatePresence>
            {
                (isReceivable && !isValidClient) && (
                    <PanelContainer
                        key='receivable-panel'
                        initial='hidden'
                        animate='visible'
                        exit='hidden'
                        variants={containerVariants}
                    >
                        <Header>
                            <Label>Balance pendiente</Label>
                            <Label>{useFormatPrice(getPositive(currentBalance))}</Label>
                        </Header>
                        <Form
                            layout='vertical'
                            form={form}
                        >
                            <Group>
                                <FormItem
                                    label="Frecuencia de Pago"
                                    name='paymentFrequency'
                                    rules={[{ required: true, message: 'Por favor seleccione una frecuencia de pago' }]}
                                >
                                    <Select
                                        value={paymentFrequency}
                                        style={{ width: '100%' }}
                                        onChange={(e) => setFrequency(e)}
                                    >
                                        <Option value="monthly">Mensual</Option>
                                        <Option value="weekly">Semanal</Option>
                                    </Select>
                                </FormItem>
                                <FormItem
                                    label="Cuotas"
                                    name='totalInstallments'
                                    rules={[
                                        { required: true, message: 'Por favor seleccione el número de cuotas' },
                                        { type: 'number', min: 1, max: maxInstallments, message: `El número de cuotas debe estar entre 1 y ${maxInstallments}` }
                                    ]}
                                >
                                    <InputNumber value={totalInstallments} onChange={setInstallments} style={{ width: '100%' }} />
                                </FormItem>
                            </Group>
                            <Group>
                                <FormItem
                                    label="Fecha de Pago"
                                    name='paymentDate'
                                    rules={[{ required: true, message: 'Por favor seleccione una fecha de pago' }]}
                                >
                                    <DatePicker
                                        format={'DD/MM/YYYY'}
                                        style={{ width: '100%' }}
                                        value={fromMillisToDayjs(paymentDate)}
                                        onChange={(date) => setPaymentDate(date.valueOf())}
                                    />
                                </FormItem>
                                <FormItem
                                    label="Monto por Cuota"
                                >
                                    <div style={{
                                        textAlign: '',
                                        fontWeight: 600
                                    }}>
                                        <span>{useFormatPrice(installmentAmount)}</span>
                                    </div>
                                </FormItem>
                            </Group>
                            <FormItem
                                label="Comentarios"
                                name='comments'
                            >
                                <TextArea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} />
                            </FormItem>
                        </Form>
                        <Footer>
                            <Header>
                                <Label>Total a Crédito.</Label>
                                <Label>{useFormatPrice(getPositive(change))}</Label>
                            </Header>
                            <Header>
                                <Label>Balance General</Label>
                                <Label>{useFormatPrice(getPositive(generalBalance))} / {useFormatPrice(creditLimit?.creditLimit?.value || 0)}</Label>
                            </Header>
                        </Footer>
                    </PanelContainer>)
            }
        </AnimatePresence>
    )
};

const PanelContainer = styled(motion.div)`
  padding: 6px 12px;
  background: #f4f4f4;
  border-radius: 8px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Header = styled.div`
  padding: 0.2em 0;
  display: flex;
  justify-content: space-between;
`;

const Footer = styled.div`
    :nth-child(n){
        div{
            border-bottom: 1px solid #ccc;
            :last-child{
                border-bottom: 0;
            }
        }
    }
 
`

const Label = styled.span
    `
    color: #333;
    font-weight: 600;
    font-size: 1.1em;
    display: block;
    margin-bottom: 5px;
`;

const FormItem = styled(antd.Form.Item)`
  margin-bottom: 15px;
`;

const Group = styled.div`
    display: grid;
    gap: 1em;
    grid-template-columns: 1fr 0.8fr;
`;