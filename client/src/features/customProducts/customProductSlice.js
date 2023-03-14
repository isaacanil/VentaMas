import { createSlice } from "@reduxjs/toolkit";
import { useState } from "react";
import { useSelector } from "react-redux";

const initialState = {
    product:{

    },
    ingredient: [],
    ingredientList: '',
    totalIngredients: {
        value: 0
    },
    totalProductPrice: 0
}
const customProductSlice = createSlice({
    name: 'customProduct',
    initialState,
    reducers: {
        addProduct: (state, actions) => {
            state.product = actions.payload
        },
        addIngredient: (state, action) => {
            const checkingID = state.ingredient.find(({ id }) => id === action.payload.id)
            checkingID ? (
                console.log('ya esta gregado')
            ) : state.ingredient.push(action.payload)
        },
        deleteIngredient: (state, action) => {
            const checkingID = state.ingredient.find(({ id }) => id === action.payload.id)
            if (checkingID) {
                state.ingredient.splice(state.ingredient.indexOf(checkingID), 1)
                console.log('quitando 1')

            } else {
                console.log('quitando 2')
            }

        },
        gettingIngredientList: (state, action) => {
            let list = [];
            const result = state.ingredient.map((ingredient) => (
                list = [
                    ...list,
                    ingredient.name
                ]
            ))
            state.ingredientList = list.toString()

        },
        totalPurchase: (state) => {
            const n = state.ingredient.reduce((total, ingredient) => total + Number(ingredient.cost), 0)
            state.totalIngredients.value = n
           
        },
        formatData: (state) => {
           
                state.ingredient = [],
                state.ingredientList = '',
                state.totalIngredients = {
                    value: 0
                },
                state.totalProductPrice = 0
            
        }

    }
})
export const {
    addIngredient,
    gettingIngredientList,
    totalPurchase,
    deleteIngredient,
    formatData
} = customProductSlice.actions

export default customProductSlice.reducer

export const selectTotalIngredientPrice = (state) => state.customProduct.totalIngredients.value
export const selectIngredientList = (state) => state.customProduct.ingredient;
export const SelectIngredientsListName = (state) => state.customProduct.ingredientList