
import React from 'react'
import { CgMathPlus } from 'react-icons/cg'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { toggleAddPurchaseModal } from '../../../features/modals/modalSlice'
import { Button } from '../../templates/system/Button/Button'
import { Tooltip } from '../../templates/system/Button/Tooltip'
import { OrderFilter } from './components/OrderFilter/OrderFilter'

export const ToolBar = () => {
    const dispatch = useDispatch()
    const openModal = () => {dispatch(toggleAddPurchaseModal())}
    return (
        <Container>
            <Wrapper>  
                <OrderFilter></OrderFilter>
                <Tooltip 
                description='Realizar Comprar'
                Children={
                    <Button
                        borderRadius='normal'
                        bgcolor='primary'
                        startIcon={<CgMathPlus/>}
                        title={`Comprar`}
                        onClick={openModal}
                    />
                }/>
            </Wrapper>
        </Container>
    )
}
const Container = styled.div`
    height: 2.50em;
    width: 100%;
    background-color: rgb(255, 255, 255);
    display: flex;
    align-items: center;
    justify-content: center;
   
`
const Wrapper = styled.div`
    width: 100%;
    padding: 0 1em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1em;
`