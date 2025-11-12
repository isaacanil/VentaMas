import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '../../../../../../features/auth/userSlice';
import { selectTotalIngredientPrice } from '../../../../../../features/customProducts/customProductSlice';
import { fbGetCustomProduct } from '../../../../../../firebase/products/customProduct/fbGetCustomProductTypePizza';
import { separator } from '../../../../../../hooks/separator';
import { Button } from '../../../../../templates/system/Button/Button';
import { IngredientCard } from '../../../../../templates/system/customProduct/typePizza/IngredientCard';

export const IngredientList = ({ handleIngredientOpen }) => {
    const user = useSelector(selectUser)
    const [customProduct, setCustomProduct] = useState('')
    useEffect(() => {
        fbGetCustomProduct(user, setCustomProduct)
    }, [user])
    const totalIngredientPrice = useSelector(selectTotalIngredientPrice)
    return (
        <Container>
                <IngredientsWrapper>
                    {
                        customProduct ? (
                            customProduct.ingredientList.length > 0 ? (
                                customProduct.ingredientList
                                    .sort((a, b) => {
                                        return a.name > b.name ? 1 : -1;
                                    })
                                    .map((item, index) => (
                                        <IngredientCard key={index} item={item} index={index} />
                                    ))
                            ) : null
                        ) : null
                    }
                </IngredientsWrapper>
                <IngredientPriceBar>
                    <Button borderRadius='normal' title={'Editar Ingredientes'} onClick={handleIngredientOpen} />
                    <span>Total: RD$ {separator(totalIngredientPrice)}</span>
                </IngredientPriceBar>
          
        </Container>
    )
}

const Container = styled.div`
    margin: 0;
    padding: 0;
    border-radius: 10px;
    height: 100%;
    display: grid;
    grid-template-rows: 1fr min-content;
    background-color: rgb(218, 217, 217);
    position: relative;
    overflow: hidden;
    `
const IngredientsWrapper = styled.ul`
    overflow-y: scroll;
   
    width: 100%;
    background-color: #D9D9D9;
    padding: 0.6em;
    display: grid;
    grid-auto-rows: min-content;
    grid-template-columns: repeat(auto-fill, minmax(14em, 1fr));
    gap: 0.6em;


`
const IngredientPriceBar = styled.div`
    width: 100%;
    display: flex;
    height: 2.4em;
    align-items: center;
    padding: 0 1em;
    justify-content: space-between;
    border-top: var(--border-primary);
   
`