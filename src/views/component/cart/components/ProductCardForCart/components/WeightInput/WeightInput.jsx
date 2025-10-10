import React from 'react';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { changeProductWeight } from '../../../../../../../features/cart/cartSlice';

export const WeightInput = ({ item }) => {
  const dispatch = useDispatch();
  
  const handleWeightChange = (e) => {
    dispatch(changeProductWeight({ 
      id: item.cid, 
      weight: e.target.value 
    }));
  };
  
  return (
    <WeightContainer>
      <Input
        value={`${(item?.weightDetail?.weight)}`}
        onChange={handleWeightChange}
      />
      <UnitLabel>{item?.weightDetail?.weightUnit}</UnitLabel>
    </WeightContainer>
  );
};

const WeightContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1em;
`;

const Input = styled.input`
  width: 100%;
  height: 1.8em;
  font-size: 14px;
  font-weight: 600;
  border-radius: 6px;
  padding: 0 10px;
  background-color: var(--White3);
  border: 2px solid var(--Gray4);
  color: var(--Gray6);
  outline: none;
`;

const UnitLabel = styled.span`
  font-size: 14px;
  font-weight: 500;
  color: var(--Gray6);
`;

export default WeightInput;