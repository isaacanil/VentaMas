import React from 'react'
import styled from 'styled-components'
import { FormattedValue } from '../../../../../templates/system/FormattedValue/FormattedValue'
import { Button, ButtonGroup } from '../../../../../templates/system/Button/Button'
import { motion } from 'framer-motion'
import { useSelector } from 'react-redux'
import { selectCurrentUserNotification } from '../../../../../../features/UserNotification/UserNotificationSlice'

export const AlertDialog = ({onSubmit,  submitBtnName }) => {
  
    const confirmation = useSelector(selectCurrentUserNotification);
    const {isOpen, title, description} = confirmation;

    const BackdropVariants = {
        hidden: {
            opacity: 0,
            pointerEvent: 'none'
        },
        visible: {
            opacity: 1,
            pointerEvent: 'auto'
        }
    }
    const ContainerVariants = {
        hidden: {
            opacity: 0,
            scale: 0.5
        },
        visible: {
            opacity: 1,
            scale: 1,
            transition: {
                type: 'spring',
                stiffness: 100,
                damping: 15
            }
        }
    }
    return (
        isOpen &&
        <Backdrop
            variants={BackdropVariants}
            initial={'hidden'}
            animate={ isOpen ? 'visible' : 'hidden'}

        >
            <Container
                variants={ContainerVariants}
                initial={'hidden'}
                animate={ isOpen ? 'visible' : 'hidden'}
            >
                <Header>
                    <FormattedValue type={'title'} value={title} />
                </Header>
                <Body>
                    <FormattedValue type={'paragraph'} value={description} />
                </Body>
                <Footer>
                    <Group>
                        <ButtonGroup>
                         
                            <Button
                                title={submitBtnName || 'Confirmar'}
                                onClick={onSubmit}
                                bgcolor={'primary'}
                            />
                        </ButtonGroup>
                    </Group>
                </Footer>
            </Container>
        </Backdrop>
    )
}
const Backdrop = styled(motion.div)`
    height: 100vh;
    width: 100vw;
    backdrop-filter: blur(5px) brightness(0.5) saturate(100%) contrast(100%);
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
    top: 0;
    left: 0;
    z-index: 10000;
`
const Container = styled(motion.div)`
    height: 300px;
    max-width: 600px;
    width: 100%;
    background-color: white;
    border-radius: var(--border-radius);
    padding: 0.4em;
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    gap: 1em;
`
const Header = styled.div`
    padding: 1em;
`
const Body = styled.div`
    padding:  0 1em;
`

const Footer = styled.div`

`
const Group = styled.div`
    display: flex;
    justify-content: flex-end;
`