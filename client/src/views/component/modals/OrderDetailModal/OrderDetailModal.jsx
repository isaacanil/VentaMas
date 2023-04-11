import React from 'react';
import styled from 'styled-components';
import { AiOutlineClose } from 'react-icons/ai';
import { NoteViewer } from './components/NoteViewer';
import { InfoCard } from './Card';
import { Button } from '../../../templates/system/Button/Button';
import { MdClose } from 'react-icons/md';
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
  const { products, totalPurchase, id, note, provider, condition, state, updatedAt }  = order;

  return (
    <ModalWrapper>
      <ModalContent>         
        <Header/>

        {/* {Array.isArray(products) && products.length > 0 && products.map(({product})=> (
        
        ))} */}
     
     
          </ModalContent>
</ModalWrapper>
  )};
