import {createSlice} from '@reduxjs/toolkit'
import { deleteProduct } from '../../firebase/firebaseconfig'

const initialState = {
    deleteProduct: {
        isOpen: false,
        isSuccess: false,
        id: null
    },
}
export const alertSlice = createSlice({
    name: 'alert',
    initialState,
    reducers: {
        handleDeleteProductAlert: (state, actions) => {
            const id = actions.payload
            const isOpen = state.deleteProduct.isOpen
            state.deleteProduct.isOpen = !isOpen
            state.deleteProduct.id = id
            
        },
        handleDeleteProductAlertSuccess: (state) => {
            const id = state.deleteProduct.id
            deleteProduct(id)
          
        }
       
    }
})

export const {handleDeleteProductAlert, handleDeleteProductAlertSuccess } = alertSlice.actions;

//selectors
export const selectDeleteProductAlert = (state) => state.alert.deleteProduct.isOpen;

export default alertSlice.reducer