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
import { AddCondition, deleteReceiptImageFromPurchase, selectProducts, setDate, setNote } from '../../../../../features/Purchase/addPurchaseSlice'
import { convertMillisToDate } from '../../../../../hooks/useFormatTime'
import { selectUser } from '../../../../../features/auth/userSlice'
import { icons } from '../../../../../constants/icons/icons'


export const PurchaseDetails = ({ SELECTED_PURCHASE }) => {

    const dispatch = useDispatch()
    const [imgReceipt, setImgReceipt] = useState(null)
    const user = useSelector(selectUser)
    const handleReceiptImg = async (img) => {
        if (!SELECTED_PURCHASE?.orderId) {

            return;
        }
        try {
            fbAddPurchaseReceiptImg(user, dispatch, img, SELECTED_PURCHASE?.orderId)
        } catch (error) {

        }
        // fbDeletePurchaseReceiptImg({url: 'https://firebasestorage.googleapis.com/v0/b/hipizza-1b9cc.appspot.com/o/receiptPurchaseImg%2Fc1a61eb1-afdf-44a3-b904-0969b6ed637a.jpg?alt=media&token=c283a281-62b4-468b-b3aa-3a6af65477c7'})¿
    }
    const handleImgView = () => dispatch(toggleImageViewer({ show: true, url: SELECTED_PURCHASE.receiptImgUrl }));
    const beforeToday = new Date()
    const handleDateChange = (value) => {
        const selectedDate = DateTime.fromISO(value);
        const timestamp = selectedDate.toJSDate().getTime();
        return timestamp;
    };
    const handleDeleteReceiptImageFromPurchase = () => {
        dispatch(deleteReceiptImageFromPurchase())
    }
    const dateValue = typeof SELECTED_PURCHASE?.dates?.deliveryDate === 'number' && SELECTED_PURCHASE?.dates?.deliveryDate;
    const formattedDate = dateValue ? DateTime.fromMillis(dateValue).toISODate() : '';
    useEffect(() => {
        if (SELECTED_PURCHASE.orderId) {
            dispatch(clearImageViewer())
        }
    }, [SELECTED_PURCHASE])

    return (
        <Container>
            <Section flex>
                <InputDate
                    type="date"
                    name="" id=""
                    value={formattedDate}
                    // value={SELECTED_PURCHASE?.dates?.deliveryDate}
                    min={beforeToday.toISOString().substring(0, 10)}
                    onChange={(e) => dispatch(setDate(handleDateChange(e.target.value)))}
                />
                <Select
                    title='Condición'
                    data={orderAndDataCondition}
                    displayKey={'name'}
                    onChange={(e) => dispatch(AddCondition(e.target.value?.id))}
                    value={getOrderConditionByID(SELECTED_PURCHASE?.condition)}
                />
                {
                    SELECTED_PURCHASE?.receiptImgUrl ? (
                        <ButtonGroup>
                            <Button
                                onClick={handleImgView}
                                title='Ver recibo'
                                borderRadius='light'
                            />
                            <Button
                                title={'Imagen Recibo'}
                                borderRadius='light'
                                bgcolor={'error'}
                                startIcon={icons.operationModes.delete}
                                onClick={handleDeleteReceiptImageFromPurchase}
                            />
                        </ButtonGroup>
                    ) : (
                        SELECTED_PURCHASE?.orderId && (
                            <AddFileBtn
                                startIcon={icons.operationModes.upload}
                                title='Subir recibo'
                                id='receipt'
                                file={imgReceipt}
                                setFile={setImgReceipt}
                                fn={handleReceiptImg}
                            />)
                    )
                }
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    value={SELECTED_PURCHASE.note}
                    placeholder='Escriba una Nota...'
                    onChange={(e) => dispatch(setNote(e.target.value))}
                />
            </Section>
        </Container>
    )
}
const Container = styled.div`
display: grid;
gap: 0.4em;
`
const Section = styled.section`
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