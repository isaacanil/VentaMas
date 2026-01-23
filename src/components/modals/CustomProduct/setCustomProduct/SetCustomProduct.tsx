import { nanoid } from 'nanoid';
import { useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';


import { addProduct } from '@/features/cart/cartSlice';
import { formatData } from '@/features/customProducts/customProductSlice';
import { handleModalSetCustomPizza } from '@/features/modals/modalSlice';
import { addNotification } from '@/features/notification/notificationSlice';
import { separator } from '@/utils/number/number';
import { AddCustomProductModal } from '@/components/modals/AddCustomProductModal/AddCustomProductModal';
import { Modal } from '@/components/modals/Modal';

import { Header } from './Components/Header';
import { IngredientList } from './Components/IngredientList';

interface CustomProductPricing {
  price: number;
  cost: number;
  tax: number;
}

interface CustomProductDraft {
  name: string;
  id: string;
  pricing: CustomProductPricing;
  amountToBuy: number;
  size: string;
}

const EmptyNewProduct: CustomProductDraft = {
  name: '',
  id: '',
  pricing: {
    price: 0,
    cost: 0,
    tax: 0,
  },
  amountToBuy: 1,
  size: '',
};

interface SetCustomProductProps {
  isOpen: boolean;
}

export const SetCustomProduct = ({ isOpen }: SetCustomProductProps) => {
  const dispatch = useDispatch();
  const [IngredientModalOpen, setIngredientModalOpen] = useState(false);
  const handleIngredientOpen = () =>
    setIngredientModalOpen(!IngredientModalOpen);
  const [newProduct, setNewProduct] = useState<CustomProductDraft>(
    EmptyNewProduct,
  );
  const [initialState, setInitialState] = useState(false);

  const closeModal = () => {
    dispatch(handleModalSetCustomPizza());
    dispatch(formatData());
    setNewProduct(EmptyNewProduct);
    setInitialState(true);
  };

  const HandleSubmit = async () => {
    try {
      if (newProduct?.name === '') {
        dispatch(
          addNotification({
            message: 'Debe seleccionar un producto',
            type: 'error',
          }),
        );
        return Promise.reject(new Error('Debe seleccionar un producto'));
      }

      dispatch(addProduct(newProduct));
      return Promise.resolve();
    } catch (error) {
      console.error('Error in SetCustomProduct:', error);
      dispatch(
        addNotification({
          id: nanoid(),
          message: 'Error al agregar producto',
          type: 'error',
        }),
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      close={closeModal}
      btnSubmitName="Aceptar"
      nameRef="Producto Personalizable"
      handleSubmit={HandleSubmit}
      subModal={
        <AddCustomProductModal
          isOpen={IngredientModalOpen}
          handleOpen={handleIngredientOpen}
        />
      }
    >
      <Body>
        <Header
          Row={Row}
          Group={Group}
          newProduct={newProduct}
          setNewProduct={setNewProduct}
          initialState={initialState}
          setInitialState={setInitialState}
        />
        <IngredientList handleIngredientOpen={handleIngredientOpen} />
        <PriceBar>
          <span></span>
          <span>Total: RD$ {separator(newProduct?.pricing?.price)}</span>
        </PriceBar>
      </Body>
    </Modal>
  );
};

const Body = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 0.2em 0.4em;
  width: 100%;
  height: 100%;
  padding: 1em;
  background-color: #f1ebeb;
`;
const Row = styled.div`
  display: flex;
  gap: 1em;
  margin-bottom: 0.4em;
`;
const Group = styled.div`
  flex: 1 1 0;

  div {
    select {
      width: 100%;
    }
  }
`;

const PriceBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.4em;
  padding: 0 1em;
`;
