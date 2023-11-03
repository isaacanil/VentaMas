import { createSlice } from '@reduxjs/toolkit'
import { fbDeleteClient } from '../../firebase/client/fbDeleteClient'
import { fbDeleteProduct } from '../../firebase/products/fbDeleteproduct'


const initialState = {
    deleteProduct: {
        isOpen: false,
        isSuccess: false,
        id: null,
        user: null
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
            const
                id = actions.payload?.id,
                user = actions.payload?.user,
                isOpen = state.deleteProduct.isOpen;

            state.deleteProduct.isOpen = !isOpen;
            state.deleteProduct.id = id;
            state.deleteProduct.user = user;

        },
        handleDeleteProductAlertSuccess: (state) => {
           
            const id = state.deleteProduct.id;
            const user = state.deleteProduct.user;
            fbDeleteProduct(id, user)

        },
        handleDeleteClientAlert: (state, actions) => {
            const id = actions.payload
            const isOpen = state.deleteProduct.isOpen
            state.deleteProduct.isOpen = !isOpen
            state.deleteProduct.id = id
        },
        handleDeleteClientAlertSuccess: (state) => {
            const id = state.deleteClient.id
            fbDeleteClient(id)

        }

    }
})

export const { handleDeleteProductAlert, handleDeleteProductAlertSuccess, handleDeleteClientAlert, handleDeleteClientAlertSuccess } = alertSlice.actions;

//selectors
export const selectDeleteProductAlert = (state) => state.alert.deleteProduct;
export const selectDeleteClientAlert = (state) => state.alert.deleteClient.isOpen;

export default alertSlice.reducer