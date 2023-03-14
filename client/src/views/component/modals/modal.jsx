import React, { useState } from 'react'

//style
import Style from './modal.module.scss'

//component and pages
import { Button } from '../../index'
import { MdClose } from 'react-icons/md'
import styled from 'styled-components'

//hooks
//import { useModal } from '../../../hooks/useModal'



export const Modal = ({ children, nameRef, handleSubmit, close, btnSubmitName, isOpen, subModal }) => {

    const done = async () => {
        try {
            await handleSubmit()
            close();
        } catch (error) {
            console.log(error)
        } finally {
        }
    
}
return (

    <Backdrop isOpen={isOpen}>
        <Container>
            <div className={Style.modal_header}>

                <h3>{nameRef}</h3>
                <Button title={<MdClose />} width='icon24' borderRadius='normal' bgcolor='error' onClick={close} />

            </div>
            <div className={Style.modal_body}>
                {children}
                {subModal ? subModal : null}
            </div>
            <div className={Style.modal_footer}>
                <div className={Style.Group}>
                    <Button
                        borderRadius='normal'
                        title={btnSubmitName}
                        onClick={done}
                    />
                </div>
            </div>
        </Container>
    </Backdrop>

)
}
const Backdrop = styled.div`
     width: 100%;
    height: 100vh;
    background-color: var(--BlackOp2);
    backdrop-filter: blur(var(--blur));
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 10000;
    top: 0;
    left: 0;
   transform: scale(0);
    opacity: 0;
    transition: opacity 400ms ease-in-out;
    ${props => {
        switch (props.isOpen) {
            case true:
                return `
                transform: scale(1);
                opacity: 1;
                `
            default:
                break;
        }
    }}

`
const Container = styled.div`
 width: 100vw;
        max-width: 720px;
        height: 100%;
        max-height: 600px;
        background-color: var(--White3);
        display: grid;
        grid-template-rows: 3em auto 3em;
        border-radius: 6px;
        overflow: hidden;
        position: relative;
        `