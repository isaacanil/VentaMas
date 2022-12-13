import React, { useEffect, useState } from 'react'
import styled from 'styled-components'
import { Select } from '../../../../templates/system/Select/Select'
import { ConditionsData } from './ConditionsData'
import { AddCondition, AddNote, AddDate, SelectProducts } from '../../../../../features/addOrder/addOrderModalSlice'
import { useDispatch, useSelector } from 'react-redux'
import { Textarea } from '../../../../templates/system/Inputs/Textarea'
export const OrderDetails = () => {
    const productList = useSelector(SelectProducts)
    const dispatch = useDispatch()
    const [condition, setCondition] = useState('')
    const [note, setNote] = useState('')
    const [date, setDate] = useState('')
    console.log(date)
    useEffect(() => {
        if(condition !== '' && note !== ''){
            dispatch(
                AddCondition(condition)
            )
        }
        if(note !== ''){
            dispatch(
                AddNote(note)
            )
        }
       
      
            dispatch(AddDate(date))
        
    }, [condition, note, date])
    return (
        <Container>
            <Section flex>
                <input type="date" name="" id="" onChange={(e) => setDate(e.target.value)}/>
                <Select
                    title='Condición'
                    data={ConditionsData}
                    setValue={setCondition}
                    value={condition}

                />
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    placeholder='Escriba una Nota...'
                    onChange={(e) => setNote(e.target.value)}
                />
            </Section>

        </Container>
    )
}
const Container = styled.div`
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