import React, { useEffect, useState } from 'react'

//component and pages
import { Button } from '../../index'
import { MdClose } from 'react-icons/md'
import styled from 'styled-components'
import { ButtonGroup } from '../../templates/system/Button/Button'
import { motion } from 'framer-motion'
import { nanoid } from 'nanoid'
import { set } from 'lodash'
import { MotionWrapper } from '../base/animation/MotionWrapper'
import { icons } from '../../../constants/icons/icons'

export const Modal = ({ children, nameRef, handleSubmit, close, btnSubmitName, isOpen, subModal, width }) => {
    const [modalContent, setModalContent] = useState(false)
    const done = async () => {
        try {
            await handleSubmit()
            close();
        } catch (error) {
            console.log(error)
        } finally {
        }
    }
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                setModalContent(true);
            }, 300);
        } else {
            setModalContent(false);
        }
    }, [isOpen]);
    const backdropVariants = {
        open: {
            opacity: 1,
            pointerEvents: 'all',
        },
        closed: {
            opacity: 0,
            pointerEvents: 'none',
        }
    }
    const containerVariants = {
        open: { scale: 1 },
        closed: { scale: 0 }
    }
    return (
        <Backdrop
            variants={backdropVariants}
            initial="closed"
            animate={isOpen ? "open" : "closed"}
            exit="closed"
            transition={{ duration: 0.3 }}
            isOpen={isOpen}
        >
            <Container
                variants={containerVariants}
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                exit="closed"
                width={width}>
                <Header>
                    <Title>{nameRef}</Title>
                    <Button
                        title={icons.operationModes.close}
                        width='icon24'
                        borderRadius='normal'
                        color='error'
                        onClick={close}
                    />
                </Header>
                <Body>
                    {modalContent && (<MotionWrapper>
                        {children}
                    </MotionWrapper>)
                    }
                    {subModal ? subModal : null}
                </Body>
                <Footer>
                    <ButtonGroup>
                        <Button
                            borderRadius='normal'
                            title={'Cancel'}
                            onClick={close}
                        />
                        <Button
                            borderRadius='normal'
                            title={btnSubmitName}
                            onClick={done}
                            color='primary'
                        />
                    </ButtonGroup>
                </Footer>
            </Container>
        </Backdrop>
    )
}
const Backdrop = styled(motion.div)`
     width: 100%;
    height: 100vh;
    background-color: var(--BlackOp);
    backdrop-filter: blur(var(--blur));
    display: flex;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 10000;
    overflow-y: hidden;
    top: 0;
    left: 0;
    transition: opacity 400ms ease-in-out;
   
`
const Container = styled(motion.div)`
 width: 100vw;
 max-width: 720px;
 height: 98vh;
 max-height: 1000px;
 background-color: var(--White);
 display: grid;
 grid-template-rows: 3em auto 3em;
 border-radius: 6px;
 overflow: hidden;
 position: relative;
 @media (max-width: 768px) {
    width: 100vw;
    height: 100vh;
    max-width: 100vw;
    max-height: 100vh;
    border-radius: 0;
 }
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
border-top: 1px solid var(--Gray);
justify-content: flex-end;
align-items: center;

`
const Title = styled.div`
color: rgb(255, 255, 255);
font-weight: 600;
`