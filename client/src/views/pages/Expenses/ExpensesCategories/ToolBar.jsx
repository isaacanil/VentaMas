
import React from 'react'
import { useDispatch } from 'react-redux'
import styled from 'styled-components'
import { toggleAddCategory } from '../../../features/modals/modalSlice'
import { Button } from '../../templates/system/Button/Button'

export const ToolBar = () => {
    const dispatch = useDispatch()
    
    const openModal = () => dispatch(toggleAddCategory({isOpen: true}))

    return (
        <Container>
            <Wrapper>
                
                <Button
                    borderRadius='normal'
                    bgcolor='primary'
                    title='Agregar Categoría'
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
`
const Wrapper = styled.div`
    max-width: 1000px;
    width: 100%;
    padding: 0 1em;
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 1em;
`