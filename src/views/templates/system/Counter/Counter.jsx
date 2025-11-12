import React, { Fragment, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import {
  addAmountToProduct,
  diminishAmountToProduct,
  onChangeValueAmountToProduct,
} from '../../../../features/cart/cartSlice';
import { Alert } from '../Product/Cart/Alert';

export const Counter = ({ amountToBuy, stock, id, item }) => {
  const dispatch = useDispatch();
  const [DeletePrevent, setDeletePrevent] = useState(false);
  const [inputAmount, setInputAmount] = useState(amountToBuy || 1);

  useEffect(() => {
    setInputAmount(amountToBuy);
  }, [amountToBuy]);

  // Manejador para cambiar el valor del input en tiempo real
  const handleInputChange = (e) => {
    const value = parseInt(e.target.value, 10);

    // Validación en tiempo real si se debe restringir el stock
    if (item.restrictSaleWithoutStock && value > stock) {
      alert(
        `La cantidad solicitada no puede exceder el stock disponible (${stock} unidades).`,
      );
      setInputAmount(stock); // Limitar al stock máximo
    } else if (value > 0) {
      setInputAmount(value); // Solo permitir valores positivos
      dispatch(onChangeValueAmountToProduct({ id, value }));
    }
  };

  // Manejador para aumentar la cantidad
  const handleIncreaseCounter = () => {
    const newValue = inputAmount + 1;
    if (item.restrictSaleWithoutStock && newValue > stock) {
      alert(`No puedes agregar más de ${stock} unidades.`);
    } else {
      setInputAmount(newValue);
      dispatch(addAmountToProduct({ id, value: newValue }));
    }
  };

  // Manejador para disminuir la cantidad
  const handleDiminishCounter = () => {
    if (inputAmount > 1) {
      const newValue = inputAmount - 1;
      setInputAmount(newValue);
      dispatch(diminishAmountToProduct({ id, value: newValue }));
    } else {
      setDeletePrevent(true); // Mostrar alerta si intenta disminuir por debajo de 1
    }
  };

  return (
    <Fragment>
      <Container>
        <ButtonCounter onClick={handleDiminishCounter}>
          <MinusIcon>−</MinusIcon>
        </ButtonCounter>
        <CounterDisplay
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={inputAmount}
          onChange={handleInputChange}
        />
        <ButtonCounter
          onClick={handleIncreaseCounter}
          disabled={item.restrictSaleWithoutStock && inputAmount >= stock}
        >
          <PlusIcon>+</PlusIcon>
        </ButtonCounter>
      </Container>
      <Alert id={id} isOpen={DeletePrevent} handleIsOpen={setDeletePrevent} />
    </Fragment>
  );
};

const Container = styled.div`
  display: flex;
  align-items: center;
  background-color: #f5f5f7;
  height: 32px;
  border-radius: 10px;
  overflow: hidden;
  width: 100%;
  border: 1px solid #ddd;
`;

const ButtonCounter = styled.button`
  border: none;
  outline: none;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  width: 40px;
  height: 100%;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #eaeaea;
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CounterDisplay = styled.input`
  border: none;
  width: 34px;
  height: 100%;
  text-align: center;
  font-size: 14px;
  font-weight: 500;
  outline: none;
  background-color: white;
  color: #333;

  &::-webkit-inner-spin-button,
  &::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }
`;

const MinusIcon = styled.span`
  font-size: 16px;
  line-height: 1;
  color: #555;
  user-select: none;
`;

const PlusIcon = styled.span`
  font-size: 16px;
  line-height: 1;
  color: #555;
  user-select: none;
`;
