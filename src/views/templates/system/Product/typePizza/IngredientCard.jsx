import React from 'react';
import styled from 'styled-components';

import { deleteIngredientTypePizza } from '../../../../../firebase/firebaseconfig.jsx';
import { ButtonGroup } from '../../Button/ButtonGroup';
import { DeleteButton } from '../../Button/DeleteButton';
import { EditButton } from '../../Button/EditButton';

export const IngredientCard = ({ item }) => {
  const DeleteIngredient = (item) => {
    deleteIngredientTypePizza(item);
  };
  return (
    <Item>
      <span>{item.name}</span>
      <span>{item.cost}</span>
      <ButtonGroup>
        <DeleteButton fn={() => DeleteIngredient(item)} />
        <EditButton />
      </ButtonGroup>
    </Item>
  );
};
const Item = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr min-content min-content;
  align-items: center;
  width: 100%;
  height: 2.5em;
  padding: 0 1em;
  background-color: #f0f0f0;
  border: 1px solid rgb(0 0 0 / 30%);
  border-radius: 8px;
`;
