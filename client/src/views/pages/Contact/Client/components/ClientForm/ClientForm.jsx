import { nanoid } from 'nanoid'
import React, { useEffect, useState } from 'react'
import { MdClose } from 'react-icons/md'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'
import { handleModalCreateClient, toggleClientModal } from '../../../../../../features/modals/modalSlice'
import { useFormatPhoneNumber } from '../../../../../../hooks/useFormatPhoneNumber'
import { useFormatRNC } from '../../../../../../hooks/useFormatRNC'
import { Button, ButtonGroup } from '../../../../../templates/system/Button/Button'
import { Message } from '../../../../../templates/system/message/Message'
import { fbAddClient } from '../../../../../../firebase/client/fbAddClient'
import { fbUpdateClient } from '../../../../../../firebase/client/fbUpdateClient'
import { OPERATION_MODES } from '../../../../../../constants/modes'
import { selectUser } from '../../../../../../features/auth/userSlice'
import Typography from '../../../../../templates/system/Typografy/Typografy'

export const ClientForm = ({ isOpen, mode, data }) => {

    const dispatch = useDispatch()
    const create = OPERATION_MODES.CREATE.id;
    const update = OPERATION_MODES.UPDATE.id;
    const user = useSelector(selectUser);

    const [client, setClient] = useState({
        name: '',
        address: '',
        tel: '',
        personalID: '',
        delivery: {
            status: false,
            value: ''
        }
    })
   
    useEffect(() => {
        if (mode === update && data) {
            setClient(data);
        }
        if (mode === create && !data) {
            setClient({
                id: nanoid(8),
                name: '',
                address: '',
                tel: '',
            })
        }
    }, [mode, data])
    function validateClient(client) {
        if (client.name === '' || client.personalID === '') {
            alert("El nombre y el ID personal son obligatorios");
            return false;
        }
        return true;
    }

    const handleCreateClient = async () => {
        if (validateClient(client)) {
            try {
                fbAddClient(user, client)
            } catch (error) {
                console.log(error)
            }
        }
    }
    const handleUpdateClient = async () => {
        try {
            fbUpdateClient(user, client)
        } catch (error) {
            console.log(error)
        }
    }
    const handleOpenModal = async () => {
        try {
            dispatch(toggleClientModal({ mode: create }))
            setClient({
                id: '',
                name: '',
                address: '',
                tel: '',
                personalID: '',
                delivery: {
                    status: false,
                    value: ''
                }
            })
        } catch (error) {
            console.log(error)
        }
    }
    const handleSubmit = async () => {
        if (mode === create) {
            try {
                await handleCreateClient();
                await handleOpenModal();
            } catch (err) {
                console.log(err)
            }
        } else if (mode === update) {
            await handleUpdateClient();
            await handleOpenModal();
        }
    }

    return (
        <Backdrop>
            <Container isOpen={isOpen ? true : false}>
                    <ToolBar>
                        <Button
                            color='gray'
                            width='icon32'
                            borderRadius='normal'
                            variant='text'
                            title={<MdClose />}
                            onClick={handleOpenModal}
                        ></Button>
                        <Typography
                            variant='h4'
                            disableMargins
                        >
                            {mode === create ? 'Nuevo Cliente' : 'Editar Cliente'}
                        </Typography>
                    </ToolBar>
                    <Body>
                        <Group>
                            <label htmlFor="">Nombre</label>
                            <input
                                name='name'
                                type="text"
                                value={client.name}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        [e.target.name]: e.target.value
                                    })}
                                placeholder='Juan Pérez.'
                            />

                        </Group>
                        <Group>
                            <label htmlFor="">Teléfono
                                <Message
                                    bgColor='primary'
                                    fontSize='small'
                                    width='auto'
                                    title={(useFormatPhoneNumber(client.tel, true))}
                                >
                                </Message></label>
                            <input
                                type="text"
                                name='tel'
                                placeholder='8097204816'
                                value={client.tel}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        [e.target.name]: e.target.value
                                    })}
                            />
                        </Group>
                        <Group>
                            <label htmlFor="">RNC/Cédula
                                <Message
                                    bgColor='primary'
                                    fontSize='small'
                                    width='auto'
                                    title={(useFormatRNC(client.personalID))}

                                >
                                </Message>
                            </label>
                            <input
                                type="text"
                                placeholder='110056007'
                                name='personalID'
                                value={client.personalID}
                                onChange={(e) =>
                                    setClient({
                                        ...client,
                                        [e.target.name]: e.target.value
                                    })}
                            />
                        </Group>
                        <Group>
                            <label htmlFor="">Dirección</label>

                            <textarea
                                value={client.address}
                                name="address"
                                id=""
                                cols="20"
                                rows="5"
                                placeholder='27 de Febrero #12, Ensanche Ozama, Santo Domingo'
                                onChange={(e) => setClient({
                                    ...client,
                                    [e.target.name]: e.target.value
                                })}
                            ></textarea>
                        </Group>
                    </Body>
                    <Footer>
                        <Button
                            borderRadius='normal'
                            title={'Cerrar'}
                            color='gray-contained'
                            onClick={handleOpenModal}
                        />
                        <Button
                            borderRadius='normal'
                            title={mode === create ? 'Crear' : 'Actualizar'}
                            color='primary'
                            onClick={handleSubmit}
                        />
                    </Footer>
               
            </Container>
        </Backdrop>
    )
}
const Backdrop = styled.div`
    position: fixed;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(4px);
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100vh;
    z-index: 10000;
    overflow: hidden;
    pointer-events: none;
`
const Container = styled.div`
    max-width: 30em;
    border-radius: 4px;
    border: 1px solid #e0e0e0;
    overflow: hidden;
    width: 100%;
    height: min-content;
    background-color: var(--White1);
    pointer-events: all;
    transform: translateX(600px);  
    transition-property: transform, box-shadow;
    transition-timing-function: ease-in-out, ease-in-out;
    transition-delay: 0s, 700ms;
    transition-duration: 800ms, 600ms;

    ${(props) => {
        switch (props.isOpen) {
            case true:
                return `
                transform: translateX(0px); 
                `
            default:
                break;
        }
    }}
`

const ToolBar = styled.div`
padding: 0 0.6em;
height: 2.75em;
display: flex;
align-items: center;
gap: 0.4em;
background-color: white;
`
const Body = styled.div`
   padding: 1em;
    `
const Footer = styled.div`
    padding: 0 1em;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 0.5em;
    height: 3em;
    
`
const Group = styled.div`
display: grid;
gap: 0.2em;
margin-bottom: 1em;
background-color: rgb(254, 254, 254);
padding: 0.2em 0.6em 0.8em;
border-radius: 4px;
    label{
        display: flex;
        font-weight: 400;
        justify-content: space-between;
        font-size: 13px;
        align-items: center;
        color: #1565c0;
        font-weight: 500;
    }
    input{
        display: block;
        height: 1.8em;
        padding: 0 1em;
        border: none;
        border-radius: 4px;
        width: 100%;
        outline: 2px solid rgba(0, 0, 0, 0.050);
        color: var(--font-color);
        :focus{
            outline: 2px solid #0572ffce;
        }
       /* &:not(:placeholder-shown){
        outline: 2px solid #0572ffce;
    } */
        ::placeholder{
            color: #57575779;
        }
    }
    textarea{
        border: none;
        border-radius: 6px;
        padding: 0.4em 1em;
        outline: none;
        outline: 2px solid rgba(0, 0, 0, 0.050);
        ::placeholder{
            color: #9191917a;
        }
    }
`