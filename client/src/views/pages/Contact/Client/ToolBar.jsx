
import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { modes } from '../../../../constants/modes'
import { toggleClientModal } from '../../../../features/modals/modalSlice'
import { Button } from '../../../templates/system/Button/Button'
import { OrderFilter } from './components/OrderFilter/OrderFilter'

export const ToolBar = () => {
    const {createMode} = modes.operationModes
    const dispatch = useDispatch()
    
    const openModal = () => dispatch(toggleClientModal({mode: createMode, data: null}))
    
    return (
        <Container>
            <Wrapper>
                
                <OrderFilter></OrderFilter>

                <Button
                    borderRadius='normal'
                    bgcolor='primary'
                    title='Nuevo Cliente'
                    onClick={openModal}
                />
            </Wrapper>
        </Container>
    )
}
const Container = styled.div`
    height: 2.50em;
    width: 100vw;
    background-color: rgb(255, 255, 255);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1em;
`
const Wrapper = styled.div`
    max-width: 1000px;
    width: 100%;
    padding: 0 1em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
`