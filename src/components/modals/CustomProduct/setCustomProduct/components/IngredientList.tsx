import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { selectTotalIngredientPrice } from '@/features/customProducts/customProductSlice';
import { fbGetCustomProduct } from '@/firebase/products/customProduct/fbGetCustomProductTypePizza';
import { separator } from '@/utils/number/number';
import { Button } from '@/components/ui/Button/Button';
import { IngredientCard } from '@/components/ui/customProduct/typePizza/IngredientCard';

interface CustomProductIngredient {
  id?: string | number;
  name?: string;
  cost?: number | string;
  [key: string]: unknown;
}

interface CustomProductDocument {
  ingredientList?: CustomProductIngredient[];
}

interface IngredientListProps {
  handleIngredientOpen: () => void;
}

export const IngredientList = ({
  handleIngredientOpen,
}: IngredientListProps) => {
  type UserRootState = Parameters<typeof selectUser>[0];
  const user = useSelector((state: UserRootState) => selectUser(state));
  const [customProduct, setCustomProduct] =
    useState<CustomProductDocument | null>(null);
  useEffect(() => {
    fbGetCustomProduct(user, setCustomProduct);
  }, [user]);
  type CustomProductRootState = Parameters<
    typeof selectTotalIngredientPrice
  >[0];
  const totalIngredientPrice = useSelector((state: CustomProductRootState) =>
    selectTotalIngredientPrice(state),
  );

  const isIngredientCardItem = (
    item: CustomProductIngredient,
  ): item is Required<Pick<CustomProductIngredient, 'id' | 'name' | 'cost'>> =>
    item.id !== undefined && item.name !== undefined && item.cost !== undefined;

  return (
    <Container>
      <IngredientsWrapper>
        {customProduct?.ingredientList &&
        customProduct.ingredientList.length > 0
          ? customProduct.ingredientList
              .sort((a, b) => (String(a.name) > String(b.name) ? 1 : -1))
              .filter(isIngredientCardItem)
              .map((item, index) => (
                <IngredientCard key={String(item.id)} item={item} index={index} />
              ))
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
