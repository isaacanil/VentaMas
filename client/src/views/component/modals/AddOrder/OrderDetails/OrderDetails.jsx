import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Select } from '../../../../templates/system/Select/Select'
import { AddCondition, AddNote, AddDate, SelectProducts, SelectOrder } from '../../../../../features/addOrder/addOrderModalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
import { getOrderConditionByID, orderAndDataCondition } from '../../../../../constants/orderAndPurchaseState'
import { DateTime } from 'luxon'

export const OrderDetails = () => {
    const dispatch = useDispatch()
    const conditions = orderAndDataCondition;
    const order = useSelector(SelectOrder);
    const { note, condition, date } = order;

    const minDate = DateTime.now().toISODate();
    const handleDateChange = (value) => {
        const selectedDate = DateTime.fromISO(value);
        const timestamp = selectedDate.toJSDate().getTime();
        return timestamp;
        // Ahora puedes guardar 'timestamp' en Firestore o donde quieras
      };
    return (
        <Container>
            <Section flex>
                <input
                    type="date"
                    name=""
                    value={date}
                    id=""
                    min={minDate}
                    onChange={(e) => dispatch(AddDate(handleDateChange(e.target.value)))}
                />
                <Select
                    title='Condición'
                    data={conditions}
                    onChange={e => dispatch(AddCondition(e.target.value?.id))}
                    displayKey={'name'}
                    value={condition ? getOrderConditionByID(condition) : ''}
                />
                {/* {JSON.stringify(data)} */}
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    value={note}
                    placeholder='Agrega una nota al pedido ...'
                    onChange={(e) => dispatch(AddNote(e.target.value))}
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