import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Select } from '../../../../templates/system/Select/Select'
import { SelectOrder, setOrder } from '../../../../../features/addOrder/addOrderModalSlice'
import { DateTime } from 'luxon'
import { getOrderConditionByID, orderAndDataCondition } from '../../../../../constants/orderAndPurchaseState'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
import * as antd from 'antd'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
import { SelectStyle } from '../../CreatePurchase/CreatePurchase'
import { fromMillisToDayjs } from '../../../../../utils/date/convertMillisecondsToDayjs'
import dayjs from 'dayjs'
import FileList from '../../CreatePurchase/components/FileList'
import { InputMultipleFiles } from '../../../../templates/system/Form/InputFile/InputMultipleFiles'
const { Form, DatePicker, Input } = antd
const dateFormat = 'DD/MM/YYYY';
export const OrderDetails = ({ setFileList, fileList }) => {
    const dispatch = useDispatch()
    const order = useSelector(SelectOrder);
    const { note, condition, dates } = order;

    const handleDateChange = (value) => {
        if (value) {
            const timestamp = value.valueOf(); // Obtiene los milisegundos desde la época Unix
            dispatch(setOrder({ dates: { ...order?.dates, deliveryDate: timestamp } }));
        }
    };

    const conditionItems = orderAndDataCondition.map((item) => {
        return {
            label: item.name,
            value: JSON.stringify(item)
        }
    })
    console.log('order', order)
    const deliveryDate = typeof order?.dates?.deliveryDate === 'number' ? fromMillisToDayjs(order?.dates?.deliveryDate) : fromMillisToDayjs(new Date());

    return (
        <Container>
            <Section flex>
                <Form.Item
                    label="Fecha de entrega"
                    required
                >
                    <antd.DatePicker
                        value={deliveryDate}
                        style={SelectStyle}
                        format={dateFormat}
                        onChange={(date) => handleDateChange(date)}
                    />
                </Form.Item>
                <Form.Item
                    label='Condición'
                    required
                >
                    <antd.Select
                        placeholder={"Condición"}
                        options={conditionItems}
                        style={SelectStyle}
                        value={getOrderConditionByID(condition) || null}
                        onChange={(e) => dispatch(setOrder({ condition: JSON.parse(e).id }))}
                    />
                </Form.Item>
            </Section>
            <br />
            <Section>
                <InputMultipleFiles
                    fileList={fileList}
                    setFileList={setFileList}
                    label='Subir recibo'
                    labelVariant='label3'
                    showNameFile
                    marginBottom={false}
                />
            </Section>
            <FileList files={order?.fileList} />
            <Form.Item
                label='Nota'
            >
                <Input.TextArea
                    value={note}
                    rows={4}
                    placeholder='Escriba una Nota...'
                    onChange={(e) => dispatch(setOrder({ note: e.target.value }))}
                />
            </Form.Item>
        </Container>
    )
}
const Container = styled.div`
display: grid;

gap: 0.4em;
`
const Section = styled.section`
    ${props => props.flex ? `
        display: grid;
        grid-template-columns: min-content min-content;
        align-items: end;
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