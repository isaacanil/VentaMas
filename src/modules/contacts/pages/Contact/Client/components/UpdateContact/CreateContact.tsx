// @ts-nocheck
import { nanoid } from 'nanoid';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { handleModalCreateClient } from '@/features/modals/modalSlice';
import { formatRNC } from '@/utils/format';
import { formatPhoneNumber } from '@/utils/format/formatPhoneNumber';
import { Button } from '@/components/ui/Button/Button';
import { Message } from '@/components/ui/message/Message';


export const CreateContact = ({ isOpen }) => {
  const dispatch = useDispatch();
  const [newClient, setNewClient] = useState({
    name: '',
    address: '',
    tel: '',
    personalID: '',
    delivery: {
      status: false,
      value: '',
    },
  });

  const addIdToNewClient = async () => {
    try {
      setNewClient({
        ...newClient,
        id: nanoid(8),
      });
    } catch (error) {
      console.error('Failed to add ID to new client', error);
    }
  };

  const handleSubmit = async () => {
    await addIdToNewClient();
  };
  const handleOpenModal = () => {
    dispatch(handleModalCreateClient());
  };
  return (
    <Container>
      <SideBar $isOpen={isOpen ? true : false}>
        <ToolBar>
          <Button
            color="gray-dark"
            width="icon32"
            borderRadius="normal"
            variant="contained"
            title="×"
            onClick={handleOpenModal}
          ></Button>
          <h3>Nuevo Cliente</h3>
        </ToolBar>

        <Body>
          <Group>
            <label htmlFor="">Nombre</label>
            <input
              name="name"
              type="text"
              onChange={(e) =>
                setNewClient({
                  ...newClient,
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
                title={formatPhoneNumber(newClient.tel)}
              ></Message>
            </label>
            <input
              type="text"
              name="tel"
              placeholder="8496503586"
              value={newClient.tel}
              onChange={(e) =>
                setNewClient({
                  ...newClient,
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
                title={formatRNC(newClient.personalID)}
              ></Message>
            </label>
            <input
              type="text"
              placeholder="110056007"
              name="personalID"
              onChange={(e) =>
                setNewClient({
                  ...newClient,
                  [e.target.name]: e.target.value,
                })
              }
            />
          </Group>
          <Group>
            <label htmlFor="">Dirección</label>

            <textarea
              name="address"
              id=""
              cols="20"
              rows="5"
              placeholder="27 de Febrero #12, Ensanche Ozama, Santo Domingo"
              onChange={(e) =>
                setNewClient({
                  ...newClient,
                  [e.target.name]: e.target.value,
                })
              }
            ></textarea>
          </Group>
        </Body>
        <Footer>
          <Button
            borderRadius="normal"
            title="Crear"
            bgcolor="primary"
            onClick={handleSubmit}
          />
        </Footer>
      </SideBar>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
  overflow: hidden;
`;
const SideBar = styled.div`
  position: absolute;
  max-width: 26em;
  width: 100%;
  height: 100vh;
  box-shadow: none;
  background-color: var(--white-1);
  pointer-events: all;
  top: 0;
  right: 0;
  z-index: 10000;
  transform: translateX(600px);
  transition: transform 800ms ease-in-out 0s, box-shadow 600ms ease-in-out 700ms;

  ${({ $isOpen }) => {
    switch ($isOpen) {
      case true:
        return `
                transform: translateX(0px); 
                box-shadow: 10px 6px 20px 30px rgba(0, 0, 0, 0.200);
                `;

      default:
        break;
    }
  }}
`;

const ToolBar = styled.div`
  display: flex;
  gap: 0.1em;
  padding: 0 0.6em;
  background-color: white;

  h3 {
    color: rgb(104 104 104);
  }
`;
const Body = styled.div`
  padding: 1em;
`;
const Footer = styled.div`
  display: flex;
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
