import React from 'react';
import styled from 'styled-components';

import { deleteIngredientTypePizza } from '@/firebase/firebaseconfig';
import { ButtonGroup } from '@/components/ui/Button/ButtonGroup';
import { DeleteButton } from '@/components/ui/Button/DeleteButton';
import { EditButton } from '@/components/ui/Button/EditButton';

type Ingredient = {
  id?: string | number;
  name?: string;
  cost?: number | string;
};

type IngredientCardProps = {
  item: Ingredient;
};

export const IngredientCard = ({ item }: IngredientCardProps) => {
  const deleteIngredient = (ingredient: Ingredient) => {
    deleteIngredientTypePizza(ingredient);
  };
  return (
    <Item>
      <span>{item.name}</span>
      <span>{item.cost}</span>
      <ButtonGroup>
        <DeleteButton fn={() => deleteIngredient(item)} />
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
