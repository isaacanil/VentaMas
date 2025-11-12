import React from 'react';
import styled from 'styled-components';

import { Button } from '../../../templates/system/Button/Button';

import { Header } from './Header';

const ModalWrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
`;

const ModalContent = styled.div`
  background-color: #fff;
  width: 80%;
  height: 80%;
  overflow-y: auto;
  padding: 1rem;
  border-radius: 10px;
  position: relative;
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: 0;
  right: 0;
  background-color: transparent;
  border: none;
  cursor: pointer;

  color: #333;
`;

export const OrderDetails = ({ order, onClose }) => {
  const { note }  = order;

  return (
    <ModalWrapper>
      <ModalContent>         
        <CloseButton
          title="Cerrar"
          variant="text"
          color="on-gray"
          onClick={onClose}
        />
        <Header/>

        {/* {Array.isArray(products) && products.length > 0 && products.map(({product})=> (
        
        ))} */}
     {note && (
        <NoteSection>
          <NoteLabel>Nota</NoteLabel>
          <NoteText>{note}</NoteText>
        </NoteSection>
     )}
     
          </ModalContent>
</ModalWrapper>
  )};

const NoteSection = styled.section`
  margin-top: 1rem;
`;

const NoteLabel = styled.h3`
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const NoteText = styled.p`
  margin: 0;
  line-height: 1.4;
`;
