import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../../../hooks/separator'
import { useDispatch, useSelector } from 'react-redux'
import { addIngredient, gettingIngredientList, totalPurchase, deleteIngredient, SelectIngredientsListName } from '../../../../../features/customProducts/customProductSlice'
export const IngredientCard = ({ item }) => {
    const dispatch = useDispatch()
   
    const handleIngredient = (status, item) => {
        status ? (
            dispatch(
                addIngredient(item)
            ),
            dispatch(
                totalPurchase()
            ),
            dispatch(
                gettingIngredientList()
            )
        ) : (
            dispatch(
                deleteIngredient(item)
            ),
            dispatch(
                totalPurchase()
            ),
            dispatch(
                gettingIngredientList()
            )
     
            )
       // console.log(status)
    }
return (
    <Container>
        <input type="checkbox" name="" id="" onChange={(e) => handleIngredient(e.target.checked, item)} />
        <span>
            {item.name}
        </span>
        <span>
            RD${separator(item.cost)}
        </span>
    </Container>
)
}

const Container = styled.li`
    list-style: none;
    height: 2.2em;
    display: grid;
    align-items: center;
    grid-template-columns: min-content 1fr 0.8fr;
    gap: 1em;
    padding: 0 1em;
    background-color: #e6e6e6;
    border-radius: 8px;
`



