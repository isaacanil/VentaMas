import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';

import {
  addIngredient,
  gettingIngredientList,
  totalPurchase,
  deleteIngredient,
  selectIngredientList,
} from '../../../../../features/customProducts/customProductSlice';

export const IngredientCard = ({ item, index }) => {
  const dispatch = useDispatch();
  const IngredientsList = useSelector(selectIngredientList);
  const handleIngredient = (status, item) => {
    status
      ? (dispatch(addIngredient(item)),
        dispatch(totalPurchase()),
        dispatch(gettingIngredientList()))
      : (dispatch(deleteIngredient(item)),
        dispatch(totalPurchase()),
        dispatch(gettingIngredientList()));
  };
  const IngredientSelected = (array, id) =>
    array.some((element) => element.id === id);

  return (
    <Container htmlFor={index}>
      <input
        type="checkbox"
        name=""
        checked={IngredientSelected(IngredientsList, item.id)}
        id={index}
        onChange={(e) => handleIngredient(e.target.checked, item)}
      />
      <span>{item.name}</span>
      <Col align="end">{formatPrice(item.cost)}</Col>
    </Container>
  );
};

const Container = styled.label`
  display: grid;
  grid-template-columns: min-content 1fr 0.8fr;
  gap: 1em;
  align-items: center;
  height: 2.2em;
  padding: 0 1em;
  list-style: none;
  background-color: #f1efef;
  border-radius: 8px;
`;
const Col = styled.div`
  display: flex;
  align-items: center;
  gap: 0.4em;
  ${(props) => {
    switch (props.align) {
      case 'center':
        return `
                    justify-content: center;
                `;
      case 'end':
        return `
                    justify-content: flex-end;
                    text-align: right;
                `;
      default:
        return `
                    justify-content: flex-start;
                    
                `;
    }
  }}
`;


