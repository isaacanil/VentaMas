import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { useDispatch, useSelector } from 'react-redux'
import { Select } from '../../../../templates/system/Select/Select'
import { SelectOrder, setOrder } from '../../../../../features/addOrder/addOrderModalSlice'
import { DateTime } from 'luxon'
import { getOrderConditionByID, orderAndDataCondition } from '../../../../../constants/orderAndPurchaseState'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
import * as ant from 'antd'
import { InputV4 } from '../../../../templates/system/Inputs/GeneralInput/InputV4'
const { Form, DatePicker } = ant

export const OrderDetails = () => {
    const dispatch = useDispatch()
    const conditions = orderAndDataCondition;
    const order = useSelector(SelectOrder);
    const { note, condition, dates } = order;

    const minDate = DateTime.now().toISODate();
    const handleDateChange = (value) => {
        const selectedDate = DateTime.fromISO(value);
        const timestamp = selectedDate.toJSDate().getTime();
        return timestamp;
    };
    useEffect(() => {
        setTimeout(() => {
            dispatch(setOrder({
                dates: {
                    ...dates,
                    deliveryDate: handleDateChange(new Date().toISOString())
                }
            }))
        }, 1000)
    }, [])

    const dateValue = typeof order?.dates?.deliveryDate === 'number' && order?.dates?.deliveryDate;
    const formattedDate = dateValue ? DateTime.fromMillis(dateValue).toISODate() : null;
   
    const convertMillisecondsToJSDate = (milliseconds = 387567890976) => {
        return milliseconds ? new Date(milliseconds) : null;
      };
      const date = new Date();
      const date2 = date.getTime();
    return (
        <Container>
            <Section flex>
                <InputV4
                    type="date"
                    name=""
                    label={'Fecha de entrega'}
                    labelVariant={'label3'}
                    value={formattedDate}
                    id=""
                    min={minDate}
                    onChange={(e) => dispatch(setOrder({
                        dates: {
                            ...dates,
                            deliveryDate: handleDateChange(e.target.value)
                        }
                    }))}
                />
                <Select
                    title='Condición'
                    data={conditions}
                    onChange={e => dispatch(setOrder({ condition: e.target.value?.id }))}
                    displayKey={'name'}
                    value={condition ? getOrderConditionByID(condition) : ''}
                />
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    value={note}
                    placeholder='Agrega una nota al pedido ...'
                    onChange={(e) => dispatch(setOrder({ note: e.target.value }))}
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
        display: grid;
        grid-template-columns: min-content 1fr;
        background-color: var(--color2);
        align-items: end;
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