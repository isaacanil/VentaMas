import { createSlice } from "@reduxjs/toolkit";
import { useState } from "react";
import { useSelector } from "react-redux";

const initialState = {
    modalAddClient: {
        isOpen: false
    },
    modalAddProd: {
        isOpen: false
    },
    modalUpdateProd: {
        isOpen: false,
        id: '',
        data: {}
    },
    modalCategory: {
        isOpen: false,
    },
    modalAddOrder: {
        isOpen: false,
    },
    modalAddPurchase: {
        isOpen: false
    },
    modalAddProvider: {
        isOpen: false
    },
    modalSetCustomPizza: {
        isOpen: false
    },
    modalToggleClient: {
        isOpen: false,
        mode: 'create',
        data: null
    },
    modalToggleProvider: {
        isOpen: false,
        mode: 'create',
        data: null
    },
    modalToggleOrderNote: {
        isOpen: false,
        data: null
    }
}
const modalSlice = createSlice({
    name: 'modal',
    initialState,
    reducers: {
        openModalAddClient: (state) => { state.modalAddClient.isOpen = true },
        closeModalAddClient: (state) => { state.modalAddClient.isOpen = false },
        openModalAddProd: (state) => { state.modalAddProd.isOpen = true },
        closeModalAddProd: (state) => { state.modalAddProd.isOpen = false },
        openModalUpdateProd: (state, actions) => {
            state.modalUpdateProd.isOpen = true
            state.modalUpdateProd.prodId = actions.payload

        },
        closeModalUpdateProd: (state) => {
            state.modalUpdateProd.isOpen = false
            state.modalUpdateProd.prodId = ''
            state.modalUpdateProd.data = {}
        },
        openModalCategory: (state) => { state.modalCategory.isOpen = true },
        closeModalCategory: (state) => { state.modalCategory.isOpen = false },
        openModalAddOrder: (state) => {
            let isOpen = state.modalAddOrder.isOpen;
            state.modalAddOrder.isOpen = !isOpen;
        },
        closeModalAddOrder: (state) => {
            state.modalAddOrder.isOpen = false;
        },
        toggleAddPurchaseModal: (state) => {
            let isOpen = state.modalAddPurchase.isOpen;
            state.modalAddPurchase.isOpen = !isOpen;
        },
        openModalAddProvider: (state) => {
            let isOpen = state.modalAddOrder.isOpen;
            state.modalAddProvider.isOpen = !isOpen;
        },
        handleModalSetCustomPizza: (state) => {
            let isOpen = state.modalSetCustomPizza.isOpen;
            state.modalSetCustomPizza.isOpen = !isOpen;
        },
        toggleClientModal: (state, actions) => {
            const mode = actions.payload.mode
            let isOpen = state.modalToggleClient.isOpen;
            state.modalToggleClient.isOpen = !isOpen;
            if (isOpen === false) {
                state.modalToggleClient.mode = 'create'
                state.modalToggleClient.data = null
            }
            if (mode === 'create') {
                state.modalToggleClient.mode = mode
                state.modalToggleClient.data = null
                return
            }
            if (mode === 'update') {
                state.modalToggleClient.mode = mode
                state.modalToggleClient.data = actions.payload.data
                return
            }
        },
        toggleProviderModal: (state, actions) => {
            const mode = actions.payload.mode
            let isOpen = state.modalToggleProvider.isOpen;
            state.modalToggleProvider.isOpen = !isOpen;
            if (isOpen === false) {
                state.modalToggleProvider.mode = 'create'
                state.modalToggleProvider.data = null
            }
            if (mode === 'create') {
                state.modalToggleProvider.mode = mode
                state.modalToggleProvider.data = null
                return
            }
            if (mode === 'update') {
                state.modalToggleProvider.mode = mode
                state.modalToggleProvider.data = actions.payload.data
                return
            }
        },
        toggleViewOrdersNotes: (state, actions) => {
            const {data, isOpen} = actions.payload;
            state.modalToggleOrderNote.isOpen = !isOpen;

            if(isOpen === 'close'){
                state.modalToggleOrderNote.data = null;
                return
            }  
            if(data !== null && data !== false && isOpen === 'open'){
                state.modalToggleOrderNote.data = data;
                state.modalToggleOrderNote.isOpen = true;
                if(data == null || data == false){
                    state.modalToggleOrderNote.isOpen = false;
                    state.modalToggleOrderNote.data = null;
                    return
                }
                return
            }
        }
    }
})
export const {
    openModalAddClient,
    closeModalAddClient,
    openModalAddProd,
    closeModalAddProd,
    openModalAddOrder,
    closeModalAddOrder,
    openModalBilling,
    closeModalBilling,
    openModalUpdateProd,
    closeModalUpdateProd,
    openModalCategory,
    closeModalCategory,
    openModalAddProvider,
    handleModalSetCustomPizza,
    handleModalCreateClient,
    toggleAddPurchaseModal,
    toggleProviderModal,
    toggleClientModal,
    toggleViewOrdersNotes
} = modalSlice.actions

export const SelectBillingModal = state => state.modal.modalBilling.isOpen;
export const SelectAddPurchaseModal = state => state.modal.modalAddPurchase.isOpen;
export const SelectAddProdModal = state => state.modal.modalAddProd.isOpen;
export const SelectAddClientModal = state => state.modal.modalAddClient.isOpen;
export const SelectUpdateProdModal = state => state.modal.modalUpdateProd.isOpen;
export const SelectCategoryModal = state => state.modal.modalCategory.isOpen;
export const SelectAddOrderModal = state => state.modal.modalAddOrder.isOpen;
export const SelectSetCustomPizzaModal = state => state.modal.modalSetCustomPizza.isOpen;
export const SelectClientModalData = state => state.modal.modalToggleClient;
export const SelectProviderModalData = state => state.modal.modalToggleProvider;
export const SelectViewOrdersNotesModalData = state => state.modal.modalToggleOrderNote;


export default modalSlice.reducer