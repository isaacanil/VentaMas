import React from 'react';
import { motion } from 'framer-motion';
import styled from 'styled-components';

import { useDialog } from '../../../../Context/Dialog/DialogContext';

import { BackdropVariants, ContainerVariants } from './variants';
import { Button, ButtonGroup } from '../Button/Button';
import Typography from '../Typografy/Typografy';
import { icons } from '../../../../constants/icons/icons';
import { Button as ButtonV2 } from '../Button/ButtonV2';
const Dialog = () => {
    const { dialog, setDialogConfirm, onClose } = useDialog();

    if (!dialog.isOpen) return null;

    const { isOpen, title, type, message, onConfirm, onCancel } = dialog;

    const handleCancel = () => {

        onCancel();
    };

    const handleConfirm = () => {

        onConfirm();
    };


    const handleCancelBtnName = () => {
        switch (onConfirm) {
            case null:
                return 'Aceptar'
            default:
                return 'Cancelar'
        }
    }

    return (
        <Backdrop
            variants={BackdropVariants}
            initial={'hidden'}
            animate={isOpen ? 'visible' : 'hidden'}
        >
            <Container
                variants={ContainerVariants}
                initial={'hidden'}
                animate={isOpen ? 'visible' : 'hidden'}
            >
                <Header>
                    <Typography variant='h2' disableMargins >
                        {title}
                    </Typography>
                    <Button
                        title={icons.operationModes.close}
                        borderRadius={'round'}
                        width={'icon32'}
                        onClick={onClose}
                        bgcolor={'neutral'}
                    />


                </Header>
                <Body>
                    <Description type={type}>
                        <Icon>
                            {icons.operationModes.delete}
                        </Icon>
                        <Typography variant='p' >
                            {message}
                        </Typography>
                    </Description>
                </Body>
                <Footer>
                    <ButtonGroup>
                        {
                            <Button
                                title={handleCancelBtnName()}
                                onClick={handleCancel || onClose}
                                bgcolor={'gray'}
                                borderRadius={'light'}
                            />
                        }
                        {onConfirm !== null && (
                            <Button
                                title={'Confirmar'}
                                onClick={handleConfirm}
                                bgcolor={type}
                                borderRadius={'light'}
                            />
                        )}
                    </ButtonGroup>
                </Footer>
            </Container>
        </Backdrop>
    );
};

export default Dialog;
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
    padding: 1.4em;
    display: grid;
    grid-template-rows: min-content 1fr min-content;
    gap: 1em;
`
const Header = styled.div`
    
    display: flex;
    height: 3em;
    align-items: center;
    justify-content: space-between;
`
const Body = styled.div`
    
`

const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
`
const Description = styled.div`
    background-color: ${(props) => props?.type && props.theme.colors[props?.type].light};
    color: ${(props) => props?.type && props.theme.colors[props?.type].dark};
    padding: 1em;
    border-radius: var(--border-radius);
    display: flex;
    align-items: center;


`
const Icon = styled.div`
    width: 2em;
   
    `