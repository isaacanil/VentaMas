import React from 'react'
import styled from 'styled-components'
import { deleteIngredientTypePizza } from '../../../../../firebase/firebaseconfig'
import { ButtonGroup } from '../../Button/ButtonGroup'
import { DeleteButton } from '../../Button/DeleteButton'
import { EditButton } from '../../Button/EditButton'

export const IngredientCard = ({item}) => {
    const DeleteIngredient = (item) => {
        deleteIngredientTypePizza(item)
    }
    return (
        <Item onClick={()=> console.log(item)}>
            <span>{item.name}</span>
            <span>{item.cost}</span>
            <ButtonGroup>
                <DeleteButton fn={() => DeleteIngredient(item)} />
                <EditButton />
            </ButtonGroup>
        </Item>
    )
}
const Item = styled.div`
    height: 2.5em;
    background-color: #f0f0f0;
    width: 100%;
    border: 1px solid rgba(0, 0, 0, 0.300);
    border-radius: 8px;
    display: grid;
   
    align-items: center;
    padding: 0 1em;
    grid-template-columns: 1fr 1fr min-content min-content;
`