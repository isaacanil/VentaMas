import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Select } from '../../../../templates/system/Select/Select'

import { AddCondition, AddNote, AddDate, SelectProducts } from '../../../../../features/addOrder/addOrderModalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
import { selectOrderFilterOptions } from '../../../../../features/order/ordersSlice'
import { SelectDataFromOrder } from '../../../../../hooks/useSelectDataFromOrder'
import { Button } from '../../../../templates/system/Button/Button'
import { IoReceipt } from 'react-icons/io5'
import { AddFileBtn } from '../../../../templates/system/Button/AddFileBtn'
import { SaveImg } from '../../../../../features/uploadImg/uploadImageSlice'
import { fbAddReceiptPurchaseImg } from '../../../../../firebase/products/fbAddProductImg'
import { fbDeleteProductImg } from '../../../../../firebase/products/fbDeleteProductImg'
import { fbDeletePurchaseReceiptImg } from '../../../../../firebase/firebaseconfig'
import { fbAddPurchaseReceiptImg } from '../../../../../firebase/purchase/addPurchaseImg'
export const OrderDetails = ({ reset, setReset, SELECTED_PURCHASE }) => {
    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const productList = useSelector(SelectProducts)
    const dispatch = useDispatch()
    const [condition, setCondition] = useState(null)
    const [imgReceipt, setImgReceipt] = useState(null)
    const [note, setNote] = useState(null)
    const [date, setDate] = useState(null)
    useEffect(() => {
        if (SELECTED_PURCHASE.condition !== '') {
            setCondition(
                {
                    name: SELECTED_PURCHASE.condition.name,
                    id: SELECTED_PURCHASE.condition.id
                }
            )
        }
    }, [SELECTED_PURCHASE])
    console.log(imgReceipt, "=> imgReceipt")
    useEffect(() => {
        if (SELECTED_PURCHASE && SELECTED_PURCHASE.note) {
            setNote(SELECTED_PURCHASE.note)
        } else {
            setNote('')
        }
        if (SELECTED_PURCHASE && SELECTED_PURCHASE.date) {
            setDate(SELECTED_PURCHASE.date)
        } else {
            setDate('')
        }
    }, [SELECTED_PURCHASE])

    console.log(imgReceipt)
    const handleReceiptImg = async () => {
        try {     
            fbAddPurchaseReceiptImg(dispatch, imgReceipt)
        } catch (error) {
            
        }
        // fbDeletePurchaseReceiptImg({url: 'https://firebasestorage.googleapis.com/v0/b/hipizza-1b9cc.appspot.com/o/receiptPurchaseImg%2Fc1a61eb1-afdf-44a3-b904-0969b6ed637a.jpg?alt=media&token=c283a281-62b4-468b-b3aa-3a6af65477c7'})¿
    }

    const beforeToday = new Date()
    const data = SelectDataFromOrder(orderFilterOptions, 'Condición')
    return (
        <Container>
            <Section flex>
                <input type="date" name="" id="" value={date} min={beforeToday.toISOString().substring(0, 10)} onChange={(e) => setDate(e.target.value)} />
                <Select
                    setReset={setReset}
                    reset={reset}
                    property='name'
                    title='Condición'
                    data={data}
                    setValue={setCondition}
                    value={condition}
                    placement='top'
                />
                <AddFileBtn
                    startIcon={<IoReceipt />}
                    title='Subir recibo'
                    id='receipt'
                    file={imgReceipt}
                    setFile={setImgReceipt}
                    fn={() => handleReceiptImg()}
                />
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    value={note}
                    placeholder='Escriba una Nota...'
                    onChange={(e) => setNote(e.target.value)}
                />
            </Section>

        </Container>
    )
}
const Container = styled.div`
display: grid;
gap: 1em;
`
const Section = styled.section`
    ${props => props.flex ? `
        display: flex;
        gap: 1em;
    ` : ''}
    input[type='date']{
        width: 140px;
        height: 2em;
        padding: 0 0.4em;
        border: 1px solid rgba(0, 0, 0, 0.200);
        border-radius: 8px;
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
    }
`