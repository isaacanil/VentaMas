import { createSlice } from "@reduxjs/toolkit";
import { useState } from "react";
import { useSelector } from "react-redux";

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
        id: '',
        data: {}
    },
    modalCategory: {
        isOpen: false,
    },
    modalAddOrder: {
        isOpen: false,
    },
    modalAddProvider: {
        isOpen: false
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
        },
        openModalCategory: (state) => {state.modalCategory.isOpen = true},
        closeModalCategory: (state) => {state.modalCategory.isOpen = false},
        openModalAddOrder: (state) => {
            let isOpen = state.modalAddOrder.isOpen;
            state.modalAddOrder.isOpen = !isOpen;
        },
        closeModalAddOrder: (state) => {
            state.modalAddOrder.isOpen = false;
        },
        openModalAddProvider: (state) => {
            let isOpen = state.modalAddOrder.isOpen;
            state.modalAddProvider.isOpen = !isOpen;
        },

        
    }
})
export const { 
    openModalAddClient,
    closeModalAddClient,
    openModalAddProd,
    closeModalAddProd,
    openModalAddOrder,
    openModalBilling,
    closeModalBilling,
    openModalUpdateProd,
    closeModalUpdateProd,
    openModalCategory,
    closeModalCategory,
    openModalAddProvider
} = modalSlice.actions

export const SelectBillingModal = state => state.modal.modalBilling.isOpen
export const SelectAddProdModal = state => state.modal.modalAddProd.isOpen
export const SelectAddClientModal = state => state.modal.modalAddClient.isOpen
export const SelectUpdateProdModal = state => state.modal.modalUpdateProd.isOpen
export const SelectCategoryModal = state => state.modal.modalCategory.isOpen
export const SelectAddOrderModal = state => state.modal.modalAddOrder.isOpen

export default modalSlice.reducer