import React, { useEffect, useState } from 'react';
import { FaExclamationCircle, FaCheckCircle, FaInfoCircle } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { removeNotification, SelectNotification } from '../../../../features/notification/NotificationSlice';



export const Notification = () => {
    const [icon, setIcon] = useState(null)

    const selectedNotification = useSelector(SelectNotification)
    const { title, message, type, visible } = selectedNotification

    const dispatch = useDispatch()
    useEffect(() => {
        if (visible) {
            setTimeout(() => {
                dispatch(removeNotification())
            }, 6000);
        }
    }, [visible]);
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

    return (
        <Container type={type} visible={visible}>
            {icon ? <Icon type={type}>{icon}</Icon> : null}
            <Body>
                {title ? <Title>{title}</Title> : null}
                {message ? <Message>{message}</Message> : null}
            </Body>
        </Container>
    )
};

const Container = styled.div`
 max-width: 24em;
  width: 100%;
  min-height: 4em;
  height: auto;
color: #fff;
padding: 0.8em 1em;
border-radius: 4px;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
background-color: var(--White);
backdrop-filter: blur(20px);
display: flex;
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
z-index: 10000;
transform: translateY(-100px);
transition: transform 1s ease-in-out;

@media (max-width: 600px){
    width: 96%;
}
 ${props => {
        switch (props.visible) {
            case true:
                return `
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
font-size: 14px;
line-height: 14px;
margin: 0;
`
const Body = styled.div`
    display: grid;
    align-items: center;
    gap: 0.2em;
`
const Icon = styled.div`
    height: 2.4em;
    width: 2.8em;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--border-radius);
    svg{
        fill: white;
    }
  
    ${props => {
        switch (props.type) {
            case 'error':
                return `               
                background-color: #f18f8f;
                `
            case 'success':
                return `
                background-color: #8cd88c;
                `
            case 'info':
                return `
                background-color: #8cbcd8;
                `
            case 'warning':
                return `
                background-color: #FFCC00;
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