import React from 'react'
import styled from 'styled-components'
import { Textarea } from '../../../../templates/system/Inputs/Input'
import { Select } from '../../../../templates/system/Select/Select'

export const OrderDetails = () => {
    return (
        <Container>
            <Section flex>
                <input type="date" name="" id="" />
                <Select
                    title='Condición'
                />
            </Section>
            <Section>
                <h5>Nota</h5>
                <Textarea
                    height='4em'
                    placeholder='Escriba una Nota...'
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