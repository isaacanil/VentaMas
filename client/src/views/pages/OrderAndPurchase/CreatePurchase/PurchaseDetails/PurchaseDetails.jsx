import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Select } from '../../../../templates/system/Select/Select'
import { DateTime } from 'luxon'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
import { SelectDataFromOrder } from '../../../../../hooks/useSelectDataFromOrder'
import { Button, ButtonGroup } from '../../../../templates/system/Button/Button'
import { IoReceipt } from 'react-icons/io5'
import { AddFileBtn } from '../../../../templates/system/Button/AddFileBtn'
import { fbAddPurchaseReceiptImg } from '../../../../../firebase/purchase/addPurchaseImg'
import { clearImageViewer, toggleImageViewer } from '../../../../../features/imageViewer/imageViewerSlice'
import { getOrderConditionByID, orderAndDataCondition } from '../../../../../constants/orderAndPurchaseState'
import { deleteReceiptImageFromPurchase, selectProducts, setPurchase } from '../../../../../features/Purchase/addPurchaseSlice'
import { convertMillisToDate } from '../../../../../hooks/useFormatTime'
import { selectUser } from '../../../../../features/auth/userSlice'
import { icons } from '../../../../../constants/icons/icons'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
import InputFile from '../../../../templates/system/Form/InputFile/InputFile'

export const PurchaseDetails = ({ purchase, imgReceipt, setImgReceipt }) => {

    const dispatch = useDispatch()

    const user = useSelector(selectUser)

    const beforeToday = new Date();

    const handleDateChange = (value) => {
        const selectedDate = DateTime.fromISO(value);
        const timestamp = selectedDate.toJSDate().getTime();
        return timestamp;
    };
    const handleDeleteReceiptImageFromPurchase = () => {
        dispatch(deleteReceiptImageFromPurchase())
    }
    const deliveryDateValidate = typeof purchase?.dates?.deliveryDate === 'number';
    const paymentDateValidate = typeof purchase?.dates?.paymentDate === 'number';
    const formattedDeliveryDate = deliveryDateValidate ? DateTime.fromMillis(purchase?.dates?.deliveryDate).toISODate() : '';
    const formattedPaymentDate = paymentDateValidate ? DateTime.fromMillis(purchase?.dates?.paymentDate).toISODate() : '';

    useEffect(() => {
        if (purchase.orderId) {
            dispatch(clearImageViewer())
        }
    }, [purchase])

    return (
        <Container>
            <Section flex>
                <Select
                    title='Condición'
                    data={orderAndDataCondition}
                    displayKey={'name'}
                    onChange={(e) => dispatch(setPurchase({ condition: e.target.value?.id }))}
                    value={getOrderConditionByID(purchase?.condition)}
                />
                <InputV4
                    type="date"
                    name="" id=""
                    label={'Fecha de entrega'}
                    labelVariant={'label3'}
                    size={'medium'}
                    value={formattedDeliveryDate}
                    min={beforeToday.toISOString().substring(0, 10)}
                    onChange={(e) => dispatch(setPurchase(
                        {
                            dates: {
                                ...purchase?.dates,
                                deliveryDate: handleDateChange(e.target.value)
                            }
                        }
                    ))}
                />
                <InputV4
                    type="date"
                    name="" id=""
                    label={'Fecha de pago'}
                    labelVariant={'label3'}
                    size={'medium'}
                    value={formattedPaymentDate}
                    min={beforeToday.toISOString().substring(0, 10)}
                    onChange={(e) => dispatch(setPurchase(
                        {
                            dates: {
                                ...purchase?.dates,
                                paymentDate: handleDateChange(e.target.value)
                            }
                        }
                    ))}
                />
            </Section>
            <Section flex>
                <InputFile
                    img={imgReceipt}
                    setImg={setImgReceipt}
                    label='Subir recibo'
                    labelVariant='label3'
                    showNameFile
                    marginBottom={false}
                />
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    value={purchase.note}
                    placeholder='Escriba una Nota...'
                    onChange={(e) => dispatch(setPurchase({ note: e.target.value }))}
                />
            </Section>
        </Container>
    )
}
const Container = styled.div`
display: grid;
align-content: start;
align-items: start;
gap: 1em;
`
const Section = styled.section`
display: grid;
align-items: end;
    ${props => props.flex ? `
        display: flex;
        gap: 1em;
    ` : ''}
   
`
const InputDate = styled.input`
    width: 140px;
    height: 2.2em;
    padding: 0 0.4em;
    border: 1px solid rgba(0, 0, 0, 0.200);
    border-radius: var(--border-radius-light);
    position: relative;
    &::-webkit-calendar-picker-indicator{
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
        color: transparent;
        background: 0 0;
        margin: 0;
        opacity: 0;
        pointer-events: auto;
    }

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button,
    &::-webkit-clear-button {
        display: none;
    }
    &:focus{
        outline: 1px solid #00000081;
    }
`