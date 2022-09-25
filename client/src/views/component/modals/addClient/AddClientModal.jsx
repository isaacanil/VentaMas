import React, { useState } from 'react'
import styled from 'styled-components'
import { Modal } from '../modal'
import { InputText } from '../../../'
import { db } from '../../../../firebase/firebaseconfig'
import { setDoc, doc } from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { async } from '@firebase/util'
import { closeModalAddClient, SelectAddClientModal } from '../../../../features/modals/modalSlice'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
export const AddClientModal = () => {
    const dispatch = useDispatch()
    const isOpen = useSelector(SelectAddClientModal)
    const [client, setClient] = useState({
        name: '',
        lastName: '',
        address: '',
        tel: '',
        email: '',
        id: nanoid(4),
        personalID: ''

    })
    const [personalID, SetPersonalID] = useState('')
    const [personalIDInfo, SetPersonalIDInfo] = useState('')



    const HandleChange = (e) => {
        setClient(
            {
                ...client,
                [e.target.name]: e.target.value
            }
        )
    }
    /*console.log(client)*/
    const HandleSubmit = async () => {
        try {
            const clientRef = doc(db, 'client', client.id)
            await setDoc(clientRef, { client })
            closeModal
        } catch (error) {
            console.error("Error adding document: ", error)
        }
    }
    const closeModal = () => {
        dispatch(
            closeModalAddClient()
        )
    }
    return (

        isOpen ? (
            <Modal 
            nameRef='Agregar Cliente' 
            btnSubmitName='Guardar'
            close={closeModal} 
            handleSubmit={HandleSubmit}  >
                <Container>
                    <FormControl>
                        <Group>
                            <Label id='nombre' >Nombre Completo:</Label>
                            <InputText id='name' name={'name'} onChange={HandleChange} placeholder='Nombre'></InputText>
                        </Group>
                        
                        <Group>
                            <Label>Identificación</Label>
                            <InputText id="DocumentType" name={'personalID'} onChange={(e) => SetPersonalIDInfo(e.target.value)} placeholder='RNC / Cédula'></InputText>
                        </Group>
                        <Group span='2'>
                            <Label >Dirección: </Label>
                            <InputText name={'address'} onChange={HandleChange} placeholder='Dirección'></InputText>
                        </Group>
                        <Group>
                            <Label>Teléfono:</Label>
                            <InputText name={'tel'} onChange={HandleChange} placeholder='Teléfono'></InputText>
                        </Group>
                        <Group>
                            <Label>Correo:</Label>
                            <InputText name={'email'} onChange={HandleChange} placeholder='ejemplo@ejemplo.com'></InputText>
                        </Group>

                    </FormControl>
                </Container>
            </Modal >
        ) : null
    )
}

const Container = styled.div`
    padding: 1em;
    `
const FormControl = styled.form`
 
    display: grid;
    grid-template-columns: repeat( 2, 1fr);
    flex-wrap: wrap;
    gap: 1em;
    overflow: auto;
 
`
const Group = styled.div`
display: grid;
gap: 1em;


${(props) => {
        switch (props.span) {
            case '2':
                return `
            grid-column: 2 span;
            label{
                word-wrap: break-word;
            }
            input{
                width: 100%;
            }
           `

            default:
                break;
        }
    }}

`
const Label = styled.label`
 margin: 0 1em 0 0;
`


