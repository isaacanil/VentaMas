import React, { useEffect, useState } from 'react';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { removeNotification, selectCurrentNotification } from '../../../../features/notification/notificationSlice';
import { motion } from 'framer-motion';
import { isArray } from 'lodash';
import { Button } from '../Button/Button';
import { icons } from '../../../../constants/icons/icons';

const getTimerByType = (type) => {
    switch (type) {
        case 'success':
            return 4000;
        case 'error':
            return 10000;
        case 'warning':
            return 7000;
        default:
            return 5000;
    }
}

export const Notification = () => {
    const [icon, setIcon] = useState(null)

    const currentNotification = useSelector(selectCurrentNotification)
    const { title, message, type, visible } = currentNotification;

    const dispatch = useDispatch()

    const handleClose = () => { dispatch(removeNotification()) }

    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                handleClose()
            }, getTimerByType(6000))
        }
    }, [visible, dispatch]);

    useEffect(() => {
        if (type) {
            switch (type) {
                case 'error':
                    return setIcon(<FaExclamationCircle />)
                case 'success':
                    return setIcon(<FaCheckCircle />)
                case 'info':
                    return setIcon(<FaInfoCircle />)
                case 'warning':
                    return setIcon(<FaInfoCircle />)
                default:
                    return setIcon(null)
            }
        }
    }, [type])

    const notificationVariants = {
        hidden: {
            y: -100,
            opacity: 0,
            transition: {
                y: {
                    duration: 0.1,
                    ease: 'easeInOut'
                },
                opacity: {
                    delay: 0.8,
                    duration: 0.5, // Tiempo que desees para la opacidad
                    ease: 'easeInOut'
                }
            },
        },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: 0.5,
                ease: 'easeInOut'
            }
        }
    }

    return (
        <Container
            type={type}
            variants={notificationVariants}
            initial="hidden"
            animate={visible ? "visible" : "hidden"}
            exit="hidden"

        >
            {icon ? <Icon type={type}>{icon}</Icon> : null}
            <Body>
                {title ? <Title>{title}</Title> : <Title>{type}</Title>}
                {message ? <Message>{message}</Message> : null}
            </Body>
            <Button
                borderRadius={'light'}
                width={'icon24'}
                startIcon={icons.operationModes.close}
                onClick={handleClose}
            />
        </Container>
    );
};
const Container = styled(motion.div)`
    max-width: 24em;
    width: 100%;
    min-height: 4em;
    height: auto;
    color: #fff;
    padding: 0.8em 0.4em 0.8em 1em;
    border-radius: 4px;
    display: grid;
    grid-template-columns: min-content 1fr min-content;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    background-color: var(--White);
    backdrop-filter: blur(20px);
    align-items: center;

svg{
    width: 1.4em;
    height: 1.4em;
}

gap: 1em;
position: fixed;
top: 2px;
margin: 0 auto;
left: 0;
right: 0;
z-index: 1000000000;
transform: translateY(-100px);
transition: transform 1s ease-in-out;

@media (max-width: 600px){
    width: 96%;
}

${props => {
        switch (props.type) {
            case 'error':
                return `
                color: #5c5c5c;
                svg{
                    fill: #f18f8f;
                }
                `
            case 'success':
                return `
                color: #4e4e4e;
                svg{
                    fill: #8cd88c;
                }
                `
            case 'info':
                return `
                color: #4e4e4e;
                svg{
                    fill: #8cbcd8;
                }
                `
            case 'warning':
                return `
                color: #4e4e4e;
                svg{
                    fill: #e29843;
                }
                `
            default:
                return `
                color: #4e4e4e;
                svg{
                    fill: #8cd88c;
                }
                `
        }
    }};
`;

const Title = styled.h2`
font-weight: 600;
font-size: 16px;
line-height: 14px;
margin: 0;
text-transform: capitalize;
`
const Body = styled.div`
    display: grid;
    align-items: center;
    gap: 0.4em;
`
const Icon = styled.div`
     height: 2.4em;
    width: 2.8em;
    /*
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius); */
    height: 100%;
    display: flex;
    align-items: center;
    svg{
        fill: white;
        font-size: 1.4em;
        
    }
  
    ${props => {
        switch (props.type) {
            case 'error':
                return `  
                svg{

                    fill: #f18f8f;
                }             
                `
            case 'success':
                return `
                svg{
                    fill: #8cd88c;
                } 
           
                `
            case 'info':
                return `
                svg{
                    fill: #8cbcd8;
                }
                background-color: #8cbcd8;
                `
            case 'warning':
                return `
                svg{
                    fill: #FFCC00;
                }
              
                `
            default:
                return `

                color: #4e4e4e;
              
                `
        }
    }};
`
const Message = styled.p`
    font-size: 14px;
    line-height: 16px;
`
