// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

import { Button } from '@/views/templates/system/Button/Button';

import { Header } from './Header';

const ModalWrapper = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgb(0 0 0 / 50%);
`;

const ModalContent = styled.div`
  position: relative;
  width: 80%;
  height: 80%;
  padding: 1rem;
  overflow-y: auto;
  background-color: #fff;
  border-radius: 10px;
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: 0;
  right: 0;
  color: #333;
  cursor: pointer;
  background-color: transparent;
  border: none;
`;

export const OrderDetails = ({ order, onClose }) => {
  const { note } = order;

  return (
    <ModalWrapper>
      <ModalContent>
        <CloseButton
          title="Cerrar"
          variant="text"
          color="on-gray"
          onClick={onClose}
        />
        <Header />

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
  );
};

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
