import React, { useState } from 'react'

//component and pages
import { Button } from '../../index'
import { MdClose } from 'react-icons/md'
import styled from 'styled-components'
import { ButtonGroup } from '../../templates/system/Button/Button'

//hooks
//import { useModal } from '../../../hooks/useModal'



export const Modal = ({ children, nameRef, handleSubmit, close, btnSubmitName, isOpen, subModal, width }) => {

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
            <Container width={width}>
                <Header>
                    <h3>{nameRef}</h3>
                    <Button title={<MdClose />} width='icon24' borderRadius='normal' bgcolor='error' onClick={close} />
                </Header>
                <Body>
                    {children}
                    {subModal ? subModal : null}
                </Body>
                <Footer>
                    <ButtonGroup>
                        <Button
                            borderRadius='normal'
                            title={btnSubmitName}
                            onClick={done}
                            bgcolor='primary'
                        />
                        <Button
                            borderRadius='normal'
                            title={'Cancel'}
                            onClick={close}
                        />
                    </ButtonGroup>
                 
                </Footer>
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
    overflow-y: hidden;
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
 background-color: var(--White);
 display: grid;
 grid-template-rows: 3em auto 3em;
 border-radius: 6px;
 overflow: hidden;
 position: relative;
 ${props => {
    switch (props.width) {
        case 'small':
            return `
            width: 100vw;
            max-width: 600px;
            `
        case 'medium':
            return `
            width: 100vw;
            max-width: 800px;
            `
        case 'large':
            return `
            width: 100vw;
            max-width: 1000px;
            `
        case 'extra-large':
            return `
            width: 100vw;
            max-width: 1200px;
            `
    }
 }}
        `
const Header = styled.div`
display: flex;
color: rgb(255, 255, 255);
background-color: rgb(48, 48, 48);
align-items: center;
padding: 0 1em;
justify-content: space-between;
`
const Body = styled.div`
display: grid;
overflow: auto;
`
const Footer = styled.div`
display: flex;
padding: 0 1em;
justify-content: flex-end;
align-items: center;

`