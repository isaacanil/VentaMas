import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Select } from '../../../../templates/system/Select/Select'
import { DateTime } from 'luxon'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
import { clearImageViewer, toggleImageViewer } from '../../../../../features/imageViewer/imageViewerSlice'
import { getOrderConditionByID, orderAndDataCondition } from '../../../../../constants/orderAndPurchaseState'
import { deleteReceiptImageFromPurchase, selectProducts, setPurchase } from '../../../../../features/purchase/addPurchaseSlice'
import { convertMillisToDate } from '../../../../../hooks/useFormatTime'
import { selectUser } from '../../../../../features/auth/userSlice'
import { icons } from '../../../../../constants/icons/icons'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
import InputFile from '../../../../templates/system/Form/InputFile/InputFile'
import { getDate } from '../../../../../utils/date/getDate'
import { InputMultipleFiles } from '../../../../templates/system/Form/InputFile/InputMultipleFiles'
import * as antd from 'antd'

import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { SelectStyle } from '../CreatePurchase'
import { fromMillisToDayjs } from '../../../../../utils/date/convertMillisecondsToDayjs'
import FileList from '../components/FileList'
import { toggleProviderModal } from '../../../../../features/modals/modalSlice'
const { Input, Form } = antd
const dateFormat = 'DD/MM/YYYY';

export const PurchaseDetails = ({ purchase, fileList, setFileList }) => {
    const today = getDate("today");
    const dispatch = useDispatch()

    const user = useSelector(selectUser)

    const beforeToday = new Date();

    const handleDeleteReceiptImageFromPurchase = () => {
        dispatch(deleteReceiptImageFromPurchase())
    }
    const deliveryDateValidate = typeof purchase?.dates?.deliveryDate === 'number';
    const paymentDateValidate = typeof purchase?.dates?.paymentDate === 'number';
    
    useEffect(() => {
        if (purchase.orderId) {
            dispatch(clearImageViewer())
        }
    }, [purchase])
    useEffect(() => {
        if (!purchase.dates.paymentDate) {
            dispatch(setPurchase({ dates: { ...purchase.dates, paymentDate: today } }))
        }
        if (!purchase.dates.deliveryDate) {
            dispatch(setPurchase({ dates: { ...purchase.dates, deliveryDate: today } }))
        }
    }, [purchase])
    const conditionItems = orderAndDataCondition.map((item) => {
        return {
            label: item.name,
            value: JSON.stringify(item)
        }
    })
    const handleDateChange = (value, key) => {
        if (value) {
            const timestamp = value.valueOf(); // Obtiene los milisegundos desde la época Unix
            dispatch(setPurchase({ dates: { ...purchase?.dates, [key]: timestamp } }));
        }
    };

    return (
        <Container>
            <Section flex>
                <Form.Item
                    label='Condición'
                    required
                >
                    <antd.Select
                        placeholder="Condición"
                        options={conditionItems}
                        style={SelectStyle}
                        value={getOrderConditionByID(purchase?.condition) }
                        onChange={(e) => dispatch(setPurchase({ condition: JSON.parse(e).id }))}
                    />
                </Form.Item>
                <Form.Item
                    label="Fecha de entrega"
                    required
                >
                    <antd.DatePicker
                        value={deliveryDateValidate ? fromMillisToDayjs(purchase?.dates?.deliveryDate) : fromMillisToDayjs(Date.now())}
                        format={dateFormat}
                        onChange={(date) => handleDateChange(date, 'deliveryDate')}
                    />
                </Form.Item>
                <Form.Item label="Fecha de pago">
                    <antd.DatePicker
                        defaultValue={paymentDateValidate ? fromMillisToDayjs(purchase?.dates?.paymentDate) : fromMillisToDayjs(Date.now())}
                        format={dateFormat}
                        onChange={(date) => handleDateChange(date, 'paymentDate')}
                    />
                </Form.Item>
            </Section>
            <Section flex>
                <InputMultipleFiles
                    fileList={fileList}
                    setFileList={setFileList}
                    label='Subir recibo'
                    labelVariant='label3'
                    showNameFile
                    marginBottom={false}
                />
            </Section>
            <FileList files={purchase.fileList} />
            <Form.Item
                label='Nota'


                rules={[{ required: false }]}
                onChange={(e) => dispatch(setPurchase({ note: e.target.value }))}
            >
                <Input.TextArea
                    value={purchase.note}
                    rows={4}
                    placeholder='Escriba una Nota...'
                />
            </Form.Item>

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
      .ant-form-item {
        margin-bottom: 0; // Elimina el margen inferior del Form.Item
    }
   
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