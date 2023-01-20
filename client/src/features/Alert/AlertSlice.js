import {createSlice} from '@reduxjs/toolkit'
import { deleteClient, deleteProduct } from '../../firebase/firebaseconfig'

const initialState = {
    deleteProduct: {
        isOpen: false,
        isSuccess: false,
        id: null
    },
    deleteClient: {
        isOpen: false,
        isSuccess: false,
        id: null
    }
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
          
        },
        handleDeleteClientAlert: (state, actions) => {
            const id = actions.payload
            const isOpen = state.deleteProduct.isOpen
            state.deleteProduct.isOpen = !isOpen
            state.deleteProduct.id = id
        },
        handleDeleteClientAlertSuccess: (state) => {
            const id = state.deleteClient.id
            deleteClient(id)
          
        }
       
    }
})

export const {handleDeleteProductAlert, handleDeleteProductAlertSuccess, handleDeleteClientAlert, handleDeleteClientAlertSuccess } = alertSlice.actions;

//selectors
export const selectDeleteProductAlert = (state) => state.alert.deleteProduct.isOpen;
export const selectDeleteClientAlert = (state) => state.alert.deleteClient.isOpen;

export default alertSlice.reducer