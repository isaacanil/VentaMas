
import { createSlice } from "@reduxjs/toolkit";

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
            const checkingNameIsDifferent = state.categoryList.every((cat) => cat !== name)
            if (checkingNameIsDifferent && state.categoryList.length < 8) {
                    state.status = true
                    state.categoryList.push(name)
            }
        },
        deleteAllCategoriesSelected: (state) => {
            state.categoryList = []
            state.status = false
        },
        deleteCategorySelected: (state, action) => {
            const name = action.payload
            const checkingNameIsDifferent = state.categoryList.find((cat) => cat === name)
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