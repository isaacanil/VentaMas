import React, {Fragment} from 'react'
import styled from 'styled-components'
import { useDispatch } from 'react-redux'
import { openModalCategory, closeModalCategory } from '../../../../features/modals/modalSlice'

export const CloseButton = () => {
    const dispatch = useDispatch()
    const Close = () => {
       dispatch(
        closeModalCategory()
       )
    }
  return (
    <Fragment>
            <Container onClick={Close}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z"/></svg>
            </Container>
    </Fragment>
  )
}
const Container = styled('div')`
    width: 32px;
    height: 32px;
    padding: 0.2em;
    display: flex;
    justify-content: center;
    align-items: center;      
    border-radius: 100px;
    background-color: white;
    
    border: 1px solid rgba(0, 0, 0, 0.307);
    svg{
        width: 1em;
        fill: rgba(31, 31, 31, 0.72);
        
    }
`