import { Fragment } from "react"
import styled from "styled-components"
import { useDispatch } from "react-redux"
import { openModalAddClient } from "../../../../features/modals/modalSlice"
//import { useModal } from '../../../../hooks/useModal'
export const AddClientButton = () => {
    //const { isOpen, closeModal, openModal } = useModal(false)
    const dispatch = useDispatch()
    const Open = () => {
        dispatch(
            openModalAddClient()
        )
    }
    return (
        <Fragment>
            
            <Container onClick={Open}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M352 128c0 70.7-57.3 128-128 128s-128-57.3-128-128S153.3 0 224 0s128 57.3 128 128zM0 482.3C0 383.8 79.8 304 178.3 304h91.4C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7H29.7C13.3 512 0 498.7 0 482.3zM504 312V248H440c-13.3 0-24-10.7-24-24s10.7-24 24-24h64V136c0-13.3 10.7-24 24-24s24 10.7 24 24v64h64c13.3 0 24 10.7 24 24s-10.7 24-24 24H552v64c0 13.3-10.7 24-24 24s-24-10.7-24-24z"/></svg>
            </Container>
        </Fragment>
    )
}

const Container = styled.div`
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
        width: 1.5em;
        fill: rgba(31, 31, 31, 0.72);
        margin-left: 2px;
    }
`