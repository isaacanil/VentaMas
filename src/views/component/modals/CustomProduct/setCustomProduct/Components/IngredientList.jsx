import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { selectTotalIngredientPrice } from '../../../../../../features/customProducts/customProductSlice';
import { fbGetCustomProduct } from '../../../../../../firebase/products/customProduct/fbGetCustomProductTypePizza';
import { Button } from '../../../../../templates/system/Button/Button';
import { IngredientCard } from '../../../../../templates/system/customProduct/typePizza/IngredientCard';

import { separator } from '@/utils/number/number';

export const IngredientList = ({ handleIngredientOpen }) => {
  const user = useSelector(selectUser);
  const [customProduct, setCustomProduct] = useState('');
  useEffect(() => {
    fbGetCustomProduct(user, setCustomProduct);
  }, [user]);
  const totalIngredientPrice = useSelector(selectTotalIngredientPrice);
  return (
    <Container>
      <IngredientsWrapper>
        {customProduct
          ? customProduct.ingredientList.length > 0
            ? customProduct.ingredientList
                .sort((a, b) => {
                  return a.name > b.name ? 1 : -1;
                })
                .map((item, index) => (
                  <IngredientCard key={index} item={item} index={index} />
                ))
            : null
          : null}
      </IngredientsWrapper>
      <IngredientPriceBar>
        <Button
          borderRadius="normal"
          title={'Editar Ingredientes'}
          onClick={handleIngredientOpen}
        />
        <span>Total: RD$ {separator(totalIngredientPrice)}</span>
      </IngredientPriceBar>
    </Container>
  );
};

const Container = styled.div`
  position: relative;
  display: grid;
  grid-template-rows: 1fr min-content;
  height: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
  background-color: rgb(218 217 217);
  border-radius: 10px;
`;
const IngredientsWrapper = styled.ul`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(14em, 1fr));
  grid-auto-rows: min-content;
  gap: 0.6em;
  width: 100%;
  padding: 0.6em;
  overflow-y: scroll;
  background-color: #d9d9d9;
`;
const IngredientPriceBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.4em;
  padding: 0 1em;
  border-top: var(--border-primary);
`;
