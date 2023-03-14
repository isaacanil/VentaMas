import React, { useEffect, useState } from 'react'
import { useSelector } from 'react-redux';
import styled from 'styled-components';
import { selectTotalIngredientPrice } from '../../../../../../features/customProducts/customProductSlice';
import { getCustomProduct } from '../../../../../../firebase/firebaseconfig';
import { separator } from '../../../../../../hooks/separator';
import { IngredientCard } from '../../../../../templates/system/customProduct/typePizza/ingredientCard';
import { isEmpty } from '@firebase/util'
import { Button } from '../../../../../templates/system/Button/Button';
export const IngredientList = ({handleIngredientOpen}) => {
    const [customProduct, setCustomProduct] = useState({
        ingredientList: []
    })
    const totalIngredientPrice = useSelector(selectTotalIngredientPrice)

    useEffect(() => { getCustomProduct(setCustomProduct) }, [])
  return (
    <Container>
    <Ingredients>
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
    </Ingredients>
</Container>
  )
}

const Container = styled.div`
    margin: 0;
    padding: 0;
    border-radius: 10px;
    height: auto;
    position: relative;
    `

const Ingredients = styled.div`
    display: grid;
    height: auto;
    grid-template-rows: 1fr min-content;
    background-color: rgb(217, 217, 217);
    position: relative;
    overflow: hidden;
    border-radius: 8px;


    `
const IngredientsWrapper = styled.ul`
    overflow-y: scroll;
    height: 15em;
    width: 100%;
    background-color: #D9D9D9;
    box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.137);
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
`