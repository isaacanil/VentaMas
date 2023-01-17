import { nanoid } from 'nanoid'
import React, { useState } from 'react'
import { MdClose } from 'react-icons/md'
import styled from 'styled-components'
import { useFormatPhoneNumber } from '../../../../../../hooks/useFormatPhoneNumber'
import { useFormatRNC } from '../../../../../../hooks/useFormatRNC'
import { Button } from '../../../../../templates/system/Button/Button'
import { Message } from '../../../../../templates/system/message/Message'

export const CreateContact = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [newClient, setNewClient] = useState({
        name: '',
        address: '',
        tel: '',
        personalID: '',
        delivery: {
            status: false,
            value: ''
        }
    })
    console.log(newClient)
    function validateNewClient(client) {
        if (!client.name || !client.personalID) {
            alert("El nombre y el ID personal son obligatorios");
            return false;
        }
        return true;
    }
    const addIdToNewClient = async () => {
        try {
            setNewClient({
                ...newClient,
                id: nanoid(8)
            })
        } catch (error) {

        }
    }
    const handleCreateClient = async () => {

        if (validateNewClient(newClient)) {
            try {
                createClient(newClient)
            } catch (error) {
                console.log(error)
            }
        }
    }
    const showClient = async () => {
        try {
            console.log(newClient, '//////....../////')
        } catch (err) {
            console.log(err)
        }
    }
    const handleSubmit = async () => {
        //await handleCreateClient()
        await addIdToNewClient()
        await showClient()
    }
    return (
        <Container>
            <SideBar isOpen={isOpen ? true : false}>
                <ToolBar>
                    <Button
                        color='gray-dark'
                        width='icon32'
                        borderRadius='normal'
                        variant='contained'
                        title={<MdClose />}
                    ></Button>
                    <h3>Nuevo Cliente</h3>
                </ToolBar>

                <Body>
                    <Group>
                        <label htmlFor="">Nombre</label>
                        <input name='name' type="text"
                            onChange={(e) =>
                                setNewClient({
                                    ...newClient,
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
                                title={(useFormatPhoneNumber(newClient.tel))}
                            >
                            </Message></label>
                        <input type="text" name='tel' placeholder='8496503586' value={newClient.tel}
                            onChange={(e) =>
                                setNewClient({
                                    ...newClient,
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
                                title={(useFormatRNC(newClient.personalID))}

                            >
                            </Message>
                        </label>
                        <input type="text" placeholder='110056007'
                            name='personalID'
                            onChange={(e) =>
                                setNewClient({
                                    ...newClient,
                                    [e.target.name]: e.target.value
                                })}
                        />
                    </Group>
                    <Group>
                        <label htmlFor="">Dirección</label>

                        <textarea name="address" id="" cols="20" rows="5"
                            placeholder='27 de Febrero #12, Ensanche Ozama, Santo Domingo'
                            onChange={(e) => setNewClient({
                                ...newClient,
                                [e.target.name]: e.target.value
                            })}
                        ></textarea>
                    </Group>


                </Body>
                <Footer>
                    <Button
                        borderRadius='normal'
                        title='Crear'
                        bgcolor='primary'
                        onClick={handleSubmit}
                    />
                </Footer>
            </SideBar>
        </Container>
    )
}
const Container = styled.div`
  position: absolute;
  top: 0px;
  right: 0px;
    max-width: 26em;
    width: 100%;
    height: 100vh;
    overflow: hidden;

   
`
const SideBar = styled.div`
    position: absolute;
    max-width: 26em;
    width: 100%;
    background-color: var(--White1);
    top: 0;
    right: 0;
    z-index: 10;
    
    transform: translateX(600px);  
    transition: transform 0.4s ease-in-out;
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

const Head = styled.div`
    padding: 0 1em;
    h3{
        margin: 0 0 1em;
        color: var(--Black4);
    }
`
const ToolBar = styled.div`
padding: 0 0.6em;
display: flex;
gap: 0.1em;
background-color: white;
h3{
    color: rgb(104, 104, 104);
}
`
const Body = styled.div`
   padding: 1em;
    `
const Footer = styled.div`
    padding: 0 1em;
    display: flex;
    
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