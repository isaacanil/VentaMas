import React, { useEffect, useState } from 'react';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { removeNotification, SelectNotification } from '../../../../features/notification/NotificationSlice';

const Container = styled.div`
  /* max-width: 600px;
  width: 100%; */
  width: min-content;
color: #fff;
padding: 1em;
border-radius: 4px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
display: flex;
align-items: center;
svg{
    width: 1.2em;
    height: 1.2em;
}

gap: 0.6em;
white-space: nowrap;
position: fixed;
top: 2px;
margin: 0 auto;
left: 0;
right: 0;
z-index: 1000;
transform: translateY(-100px);
transition: transform 1s ease-in-out;

@media (max-width: 600px){
    width: 96%;
}
 ${props => {
    switch (props.visible) {
        case true:
                return`
                transform: translateY(0px); 
                `    
        default:
            break;
    }
 }}
${props => {
        switch (props.type) {
            case 'error':
                return `
                background-color: #e46a6a;
                `
            case 'success':
                return `
                background-color: #8cd88c;
                `
            default:
                return `
                background-color: #797979;
                `
        }
    }};
`;

export const Notification = () => {
    const [icon, setIcon] = useState(null)

    const selectedNotification = useSelector(SelectNotification)
    const {message, type, visible} = selectedNotification

    const dispatch = useDispatch()
    useEffect(() => {
        if (visible) {
        setTimeout(() => {
            dispatch(removeNotification())
        }, 8000);
        }
        }, [visible]);
    useEffect(() => {
        if(type){
            switch (type) {
                case 'error':
                    return setIcon(<FaExclamationCircle />)
                case 'success':
                    return setIcon(<FaCheckCircle />)
                case 'info':
                    return setIcon(<FaInfoCircle />)
                default: 
                    return setIcon(null)
            }
        }
    }, [type])

    return (
        <Container type={type} visible={visible}>
            {icon ? icon : null}
            {message}
        </Container>
    )
};

