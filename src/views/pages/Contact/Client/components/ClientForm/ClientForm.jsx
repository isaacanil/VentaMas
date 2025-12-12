import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { nanoid } from 'nanoid';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { OPERATION_MODES } from '../../../../../../constants/modes';
import { selectUser } from '../../../../../../features/auth/userSlice';
import { toggleClientModal } from '../../../../../../features/modals/modalSlice';
import { fbAddClient } from '../../../../../../firebase/client/fbAddClient';
import { fbUpdateClient } from '../../../../../../firebase/client/fbUpdateClient';
import { formatPhoneNumber } from '../../../../../../utils/format/formatPhoneNumber';
import { Button } from '../../../../../templates/system/Button/Button';
import { Message } from '../../../../../templates/system/message/Message';
import Typography from '../../../../../templates/system/Typografy/Typografy';

import { formatRNC } from '@/utils/format';

export const ClientForm = ({ isOpen, mode, data }) => {
  const dispatch = useDispatch();
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
      value: '',
    },
  });

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
      });
    }
  }, [mode, data]);
  function validateClient(client) {
    if (client.name === '' || client.personalID === '') {
      alert('El nombre y el ID personal son obligatorios');
      return false;
    }
    return true;
  }

  const handleCreateClient = async () => {
    if (validateClient(client)) {
      try {
        fbAddClient(user, client);
      } catch {
        // Handle error appropriately
      }
    }
  };
  const handleUpdateClient = async () => {
    try {
      fbUpdateClient(user, client);
    } catch {
      // Handle error appropriately
    }
  };
  const handleOpenModal = async () => {
    try {
      dispatch(toggleClientModal({ mode: create }));
      setClient({
        id: '',
        name: '',
        address: '',
        tel: '',
        personalID: '',
        delivery: {
          status: false,
          value: '',
        },
      });
    } catch {
      // Handle error appropriately
    }
  };
  const handleSubmit = async () => {
    if (mode === create) {
      try {
        await handleCreateClient();
        await handleOpenModal();
      } catch {
        // Handle error appropriately
      }
    } else if (mode === update) {
      await handleUpdateClient();
      await handleOpenModal();
    }
  };

  return (
    <Backdrop>
      <Container $isOpen={isOpen ? true : false}>
        <ToolBar>
          <Button
            color="gray"
            width="icon32"
            borderRadius="normal"
            variant="text"
            title={<FontAwesomeIcon icon={faTimes} />}
            onClick={handleOpenModal}
          ></Button>
          <Typography variant="h4" disableMargins>
            {mode === create ? 'Nuevo Cliente' : 'Editar Cliente'}
          </Typography>
        </ToolBar>
        <Body>
          <Group>
            <label htmlFor="">Nombre</label>
            <input
              name="name"
              type="text"
              value={client.name}
              onChange={(e) =>
                setClient({
                  ...client,
                  [e.target.name]: e.target.value,
                })
              }
              placeholder="Juan Pérez."
            />
          </Group>
          <Group>
            <label htmlFor="">
              Teléfono
              <Message
                bgColor="primary"
                fontSize="small"
                width="auto"
                title={formatPhoneNumber(client.tel, true)}
              ></Message>
            </label>
            <input
              type="text"
              name="tel"
              placeholder="8097204816"
              value={client.tel}
              onChange={(e) =>
                setClient({
                  ...client,
                  [e.target.name]: e.target.value,
                })
              }
            />
          </Group>
          <Group>
            <label htmlFor="">
              RNC/Cédula
              <Message
                bgColor="primary"
                fontSize="small"
                width="auto"
                title={formatRNC(client.personalID)}
              ></Message>
            </label>
            <input
              type="text"
              placeholder="110056007"
              name="personalID"
              value={client.personalID}
              onChange={(e) =>
                setClient({
                  ...client,
                  [e.target.name]: e.target.value,
                })
              }
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
              placeholder="27 de Febrero #12, Ensanche Ozama, Santo Domingo"
              onChange={(e) =>
                setClient({
                  ...client,
                  [e.target.name]: e.target.value,
                })
              }
            ></textarea>
          </Group>
        </Body>
        <Footer>
          <Button
            borderRadius="normal"
            title={'Cerrar'}
            color="gray-contained"
            onClick={handleOpenModal}
          />
          <Button
            borderRadius="normal"
            title={mode === create ? 'Crear' : 'Actualizar'}
            color="primary"
            onClick={handleSubmit}
          />
        </Footer>
      </Container>
    </Backdrop>
  );
};
const Backdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  pointer-events: none;
  backdrop-filter: blur(4px);
`;
const Container = styled.div`
  max-width: 30em;
  border-radius: 4px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  width: 100%;
  height: 100%;
  background-color: var(--white-1);
  pointer-events: all;
  transform: translateX(600px);
  transition: transform 800ms ease-in-out 0s, box-shadow 600ms ease-in-out 700ms;

  ${({ $isOpen }) => {
    switch ($isOpen) {
      case true:
        return `
                transform: translateX(0px); 
                `;
      default:
        break;
    }
  }}
`;

const ToolBar = styled.div`
  display: flex;
  gap: 0.4em;
  align-items: center;
  height: 2.75em;
  padding: 0 0.6em;
  background-color: white;
`;
const Body = styled.div`
  padding: 1em;
`;
const Footer = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  justify-content: flex-end;
  height: 3em;
  padding: 0 1em;
`;
const Group = styled.div`
  display: grid;
  gap: 0.2em;
  padding: 0.2em 0.6em 0.8em;
  margin-bottom: 1em;
  background-color: rgb(254 254 254);
  border-radius: 4px;

  label {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 500;
    color: #1565c0;
  }

  input {
    display: block;
    width: 100%;
    height: 1.8em;
    padding: 0 1em;
    color: var(--font-color);
    outline: 2px solid rgb(0 0 0 / 5%);
    border: none;
    border-radius: 4px;

    :focus {
      outline: 2px solid #0572ffce;
    }

    /* &:not(:placeholder-shown){
        outline: 2px solid #0572ffce;
    } */
    ::placeholder {
      color: #57575779;
    }
  }

  textarea {
    padding: 0.4em 1em;
    outline: none;
    outline: 2px solid rgb(0 0 0 / 5%);
    border: none;
    border-radius: 6px;

    ::placeholder {
      color: #9191917a;
    }
  }
`;
