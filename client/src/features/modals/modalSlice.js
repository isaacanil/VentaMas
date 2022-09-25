import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    modalBilling: {
        isOpen: false
    },
    modalAddClient: {
        isOpen: false
    },
    modalAddProd: {
        isOpen: false
    },
    modalUpdateProd: {
        isOpen: false,
        prodId: '',
        data: {}
    }
}
const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModalAddClient: (state) => {state.modalAddClient.isOpen = true},
        closeModalAddClient: (state) => {state.modalAddClient.isOpen = false},
        openModalAddProd: (state) => {state.modalAddProd.isOpen = true},
        closeModalAddProd: (state) => {state.modalAddProd.isOpen = false},
        openModalBilling: (state) => {state.modalBilling.isOpen = true},
        closeModalBilling: (state) => {state.modalBilling.isOpen = false},
        openModalUpdateProd: (state, actions) => {
            state.modalUpdateProd.isOpen = true
            state.modalUpdateProd.prodId = actions.payload

        },
        closeModalUpdateProd: (state) => {
            state.modalUpdateProd.isOpen = false
            state.modalUpdateProd.prodId = ''
            state.modalUpdateProd.data = {}
        }
    }
})
export const { 
    openModalAddClient,
    closeModalAddClient,
    openModalAddProd,
    closeModalAddProd,
    openModalBilling,
    closeModalBilling,
    openModalUpdateProd,
    closeModalUpdateProd
} = modalSlice.actions

export const SelectBillingModal = state => state.modal.modalBilling.isOpen
export const SelectAddProdModal = state => state.modal.modalAddProd.isOpen
export const SelectAddClientModal = state => state.modal.modalAddClient.isOpen
export const SelectUpdateProdModal = state => state.modal.modalUpdateProd

export default modalSlice.reducer