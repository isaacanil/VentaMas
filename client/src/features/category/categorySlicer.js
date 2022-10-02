
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
            console.log(checkingNameIsDifferent)
           

            if (checkingNameIsDifferent && state.categoryList.length < 8) {
                console.log('entrando')
             

                    state.status = true
                    state.categoryList.push(name)
                
            }


            
        },
        delecteProductSelected: (state) => {
            state.categoryList = []
            state.status = false
        }

    }
})
export const {
    addCategory,
    delecteProductSelected
} = categorySlice.actions

export const SelectCategoryList = state => state.category.categoryList
export const SelectCategoryStatus = state => state.category.status


export default categorySlice.reducer