import { setDoc, doc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { closeModalAddClient } from '@/features/modals/modalSlice';
import { db } from '@/firebase/firebaseconfig';
import { Modal } from '@/components/modals/Modal';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';

interface AddClientModalProps {
  isOpen: boolean;
}

interface ClientData {
  name: string;
  address: string;
  tel: string;
  email: string;
  id: string;
  personalID: string;
}

type ClientEditableField =
  | 'name'
  | 'address'
  | 'tel'
  | 'email'
  | 'personalID';

const isClientEditableField = (
  field: string,
): field is ClientEditableField =>
  field === 'name' ||
  field === 'address' ||
  field === 'tel' ||
  field === 'email' ||
  field === 'personalID';

export const AddClientModal = ({ isOpen }: AddClientModalProps) => {
  const dispatch = useDispatch();

  const [client, setClient] = useState<ClientData>({
    name: '',
    address: '',
    tel: '',
    email: '',
    id: nanoid(4),
    personalID: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (!isClientEditableField(name)) {
      return;
    }
    setClient((prevClient) => ({
      ...prevClient,
      [name]: value,
    }));
  };
  //console.log(client)
  const closeModal = () => dispatch(closeModalAddClient());

  const handleSubmit = async (): Promise<void> => {
    try {
      const clientRef = doc(db, 'client', client.id);
      await setDoc(clientRef, { client });
      closeModal();
    } catch (error) {
      console.error('Error adding document: ', error);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      nameRef="Agregar Cliente"
      btnSubmitName="Guardar"
      close={closeModal}
      handleSubmit={handleSubmit}
    >
      <Container>
        <FormControl>
          <Group>
            <Label id="nombre">Nombre Completo:</Label>
            <InputV4
              id="name"
              name={'name'}
              onChange={handleChange}
              placeholder="Nombre"
            />
          </Group>
          <Group>
            <Label>Identificación</Label>
            <InputV4
              id="DocumentType"
              name={'personalID'}
              onChange={handleChange}
              placeholder="RNC / Cédula"
            />
          </Group>
          <Group span="2">
            <Label>Dirección: </Label>
            <InputV4
              name={'address'}
              onChange={handleChange}
              placeholder="Dirección"
            />
          </Group>
          <Group>
            <Label>Teléfono:</Label>
            <InputV4
              name={'tel'}
              placeholder="Teléfono"
              pattern="[0-9]{3}-[0-9]{3}-[0-9]{4}"
              onChange={handleChange}
            />
          </Group>
          <Group>
            <Label>Correo:</Label>
            <InputV4
              name={'email'}
              onChange={handleChange}
              placeholder="ejemplo@ejemplo.com"
            />
          </Group>
        </FormControl>
      </Container>
    </Modal>
  );
};

const Container = styled.div`
  padding: 1em;
`;
const FormControl = styled.form`
  display: grid;
  flex-wrap: wrap;
  grid-template-columns: repeat(2, 1fr);
  gap: 1em;
  overflow: auto;
`;
interface GroupProps {
  span?: '2';
}

const Group = styled.div<GroupProps>`
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
           `;

      default:
        break;
    }
  }}
`;
const Label = styled.label`
  margin: 0 1em 0 0;
`;
