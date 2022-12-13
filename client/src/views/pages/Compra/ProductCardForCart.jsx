import React from 'react'
import { IoMdClose } from 'react-icons/io'
import styled from 'styled-components'
import { Counter } from '../../templates/system/Counter/Counter'

export const ProductCardForCart = () => {
    return (
        <Container>
            <Row>
                <span>Pizza de Pollo Grande</span>
            </Row>
            <Row>
                <Group class='space-between'>
                    <span>510.00</span>
                    <Group>
                    <Counter
                        amountToBuyTotal={1}
                        id={2}
                        stock={2}
                    ></Counter>
                    <BtnClose>
                        <IoMdClose/>
                    </BtnClose>
                    </Group>
                </Group>
            </Row>
        </Container>
    )
}
const Container = styled.div`
    
    width: 100% - 0.6em;
    position: relative;
    background-color: #ffffff;
    margin: 0.3em;
    padding: 0 0.4em;
    border: 1px solid #00000024;
    border-radius: 10px;
`
const Row = styled.div`
    display: grid;
    align-items: center;
`
const Group = styled.div`
    display: flex;
    align-items: center;
    gap: 1em;
    ${props => {
        switch (props.class) {
            case 'space-between':
                return`
                    justify-content: space-between;
                `
                
        
            default:
                break;
        }
    }}
`
const BtnClose = styled.div`
    display: flex;
    align-items: center;
    background-color: red;
    color: white;
    clip-path: circle();
    padding: 0.1em;
`