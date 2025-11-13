import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { changeProductWeight } from '../../../../../../../../../features/cart/cartSlice';

export const WeightInput = ({ item }) => {
  const dispatch = useDispatch();

  const handleWeightChange = (e) => {
    dispatch(
      changeProductWeight({
        id: item.cid,
        weight: e.target.value,
      }),
    );
  };

  return (
    <WeightContainer>
      <Input
        value={`${item?.weightDetail?.weight}`}
        onChange={handleWeightChange}
      />
      <UnitLabel>{item?.weightDetail?.weightUnit}</UnitLabel>
    </WeightContainer>
  );
};

const WeightContainer = styled.div`
  display: flex;
  gap: 1em;
  align-items: center;
`;

const Input = styled.input`
  width: 100%;
  height: 1.8em;
  padding: 0 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--gray-6);
  outline: none;
  background-color: var(--white-3);
  border: 2px solid var(--gray-4);
  border-radius: 6px;
`;

const UnitLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-6);
`;

export default WeightInput;
