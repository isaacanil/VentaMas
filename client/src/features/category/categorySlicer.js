
import { createSlice } from "@reduxjs/toolkit";
import * as antd from 'antd';
const { notification } = antd;
const initialState = {
    status: false,
    categoryList: []
}
const categorySlice = createSlice({
    name: 'category',
    initialState,
    reducers: {
        addCategory: (state, action) => {
            const { id, name } = action.payload
            const checkingNameIsDifferent = state.categoryList.every((cat) => cat.id !== id)
            if (checkingNameIsDifferent && state.categoryList.length < 12) {
                state.status = true
                state.categoryList.push({ id, name })
            }
            else {
                notification.error({
                    message: 'Error',
                    description: 'No puedes agregar más de 12 categorías'
                })
            }
        },
        deleteAllCategoriesSelected: (state) => {
            state.categoryList = []
            state.status = false
        },
        deleteCategorySelected: (state, action) => {
            const { id } = action.payload
            const checkingNameIsDifferent = state.categoryList.find((cat) => cat.id === id)
            if (checkingNameIsDifferent) {
                state.categoryList.splice(state.categoryList.indexOf(checkingNameIsDifferent), 1)
            }

            if (state.categoryList.length == 0) {
                state.status = false
            }
        }

    }
})
export const {
    addCategory,
    deleteAllCategoriesSelected,
    deleteCategorySelected
} = categorySlice.actions

export const SelectCategoryList = state => state.category.categoryList
export const SelectCategoryStatus = state => state.category.status


export default categorySlice.reducer