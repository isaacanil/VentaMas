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
export const OrderDetails = ({setReset, reset}) => {
    const orderFilterOptions = useSelector(selectOrderFilterOptions)
    const productList = useSelector(SelectProducts)
    const dispatch = useDispatch()
    const [condition, setCondition] = useState(null)
    const [note, setNote] = useState(null)
    const [date, setDate] = useState(null)
    console.log(orderFilterOptions)
    useEffect(() => {
        if(condition !== ''){
            dispatch(AddCondition(condition))       
        }
        if(note !== ''){
            dispatch(AddNote(note))
        }    
        dispatch(AddDate(date))
    }, [condition, note, date])
    useEffect(()=>{
        if(reset){
            setNote('')
            setDate('')
        }
    },[reset])
    
    const beforeToday = new Date()
    const data = SelectDataFromOrder(orderFilterOptions, 'Condición')
    return (
        <Container>
            <Section flex>
                <input type="date" name="" value={date} id="" min={beforeToday.toISOString().substring(0, 10)} onChange={(e) => setDate(e.target.value)}/>
                <Select
                    property='name'
                    title='Condición'
                    data={data}
                    setValue={setCondition}
                    value={condition}
                    placement='top'
                    setReset={setReset}
                    reset={reset}
                    
                />
                <Button 
                title={"Subir recibo"}
                startIcon={<IoReceipt/>}
                bgcolor='gray'
                border=''
                borderRadius={"normal"}
                />
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    value={note}
                    placeholder='Agrega una nota al pedido ...'
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