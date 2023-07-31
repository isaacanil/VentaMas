import React from 'react'
import styled from 'styled-components'
import { separator } from '../../../../../hooks/separator'
import { useDispatch, useSelector } from 'react-redux'
import { addIngredient, gettingIngredientList, totalPurchase, deleteIngredient, selectIngredientList } from '../../../../../features/customProducts/customProductSlice'
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
export const IngredientCard = ({ item, index }) => {
    const dispatch = useDispatch()
    const IngredientsList = useSelector(selectIngredientList)
    const handleIngredient = (status, item) => {
        status ? (
            dispatch(addIngredient(item)),
            dispatch(totalPurchase()),
            dispatch(gettingIngredientList())
        ) : (
            dispatch(deleteIngredient(item)),
            dispatch(totalPurchase()),
            dispatch(gettingIngredientList())
        )
    }
    const IngredientSelected = (array, id) => array.some(element => element.id === id);

    return (
        <Container htmlFor={index}>
            <input type="checkbox" name="" checked={IngredientSelected(IngredientsList, item.id)} id={index} onChange={(e) => handleIngredient(e.target.checked, item)} />
            <span>{item.name}</span>
            <Col align='end'>{useFormatPrice(item.cost)}</Col>
        </Container>
    )
}

const Container = styled.label`
    list-style: none;
    height: 2.2em;
    display: grid;
    align-items: center;
    grid-template-columns: min-content 1fr 0.8fr;
    gap: 1em;
    padding: 0 1em;
    background-color: #f1efef;
    border-radius: 8px;
`
const Col = styled.div`
    display: flex;  
    align-items: center;
    gap: 0.4em;
    ${props => {
        switch(props.align){
            case 'center':
                return `
                    justify-content: center;
                `
            case 'end':
                return `
                    justify-content: flex-end;
                    text-align: right;
                `
            default:  
                return `
                    justify-content: flex-start;
                    
                `
        }
    }}
`



