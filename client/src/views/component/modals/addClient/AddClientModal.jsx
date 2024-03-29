import React, { useState } from 'react'
import styled from 'styled-components'
import { Modal } from '../Modal'
import { db } from '../../../../firebase/firebaseconfig.jsx'
import { setDoc, doc } from 'firebase/firestore'
import { nanoid } from 'nanoid'
import { async } from '@firebase/util'
import { closeModalAddClient, SelectAddClientModal } from '../../../../features/modals/modalSlice'
import { useSelector } from 'react-redux'
import { useDispatch } from 'react-redux'
import { InputV4 } from '../../../templates/system/Inputs/GeneralInput/InputV4.jsx'
export const AddClientModal = ({ isOpen }) => {
    const dispatch = useDispatch()

    const [client, setClient] = useState({
        name: '',
        address: '',
        tel: '',
        email: '',
        id: nanoid(4),
        personalID: ''

    })

    const HandleChange = (e) => {
        setClient(
            {
                ...client,
                [e.target.name]: e.target.value
            }
        )
    }
    //console.log(client)
    const closeModal = () => dispatch(closeModalAddClient());
    
    const HandleSubmit = async () => {
        try {
            const clientRef = doc(db, 'client', client.id)
            await setDoc(clientRef, { client })
            closeModal()
        } catch (error) {
            console.error("Error adding document: ", error)
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            nameRef='Agregar Cliente'
            btnSubmitName='Guardar'
            close={closeModal}
            handleSubmit={HandleSubmit}  >
            <Container>
                <FormControl>
                    <Group>
                        <Label id='nombre' >Nombre Completo:</Label>
                        <InputV4
                            id='name'
                            name={'name'}
                            onChange={HandleChange}
                            placeholder='Nombre'
                        />
                    </Group>
                    <Group>
                        <Label>Identificación</Label>
                        <InputV4
                            id="DocumentType"
                            name={'personalID'}
                            onChange={(e) => setClient({ ...client, personalID: e.target.value })}
                            placeholder='RNC / Cédula'
                        />
                    </Group>
                    <Group span='2'>
                        <Label >Dirección: </Label>
                        <InputV4
                            name={'address'}
                            onChange={HandleChange}
                            placeholder='Dirección'
                        />
                    </Group>
                    <Group>
                        <Label>Teléfono:</Label>
                        <InputV4
                            name={'tel'}
                            placeholder='Teléfono'
                            pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
                            onChange={(e) => setClient({ ...client, tel: e.target.value })}
                        />
                    </Group>
                    <Group>
                        <Label>Correo:</Label>
                        <InputV4
                            name={'email'}
                            onChange={HandleChange}
                            placeholder='ejemplo@ejemplo.com'
                        />
                    </Group>
                </FormControl>
            </Container>
        </Modal >

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


