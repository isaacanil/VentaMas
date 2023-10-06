import { createSlice } from '@reduxjs/toolkit'
import { diminishSequence } from './diminishSequence'
import { increaseSequence } from './increaseSequence'
import { fbUpdateTaxReceipt } from '../../firebase/taxReceipt/fbUpdateTaxReceipt'

const updateComprobante = (state, name) => {
    const comprobante = state.data.find((item) => item.data.name === name);
    if (comprobante) {
        const {type, serie, sequence, increase, quantity} = comprobante.data;
        comprobante.data.quantity = String(Number(quantity) - 1);
        comprobante.data.sequence = increaseSequence(sequence, increase, 10);
        state.ncfCode = type + serie + increaseSequence(sequence, increase, 10);
    }
}

const initialState = {
    settings: {
        taxReceiptEnabled: false,
    },
    data: [],
    ncfCode: null,
    ncfStatus: false,
}

export const taxReceiptSlice = createSlice({
    name: 'taxReceipt',
    initialState,
    reducers: {
        getTaxReceiptData: (state, action) => {          
            state.data = action.payload
        },
        IncreaseEndConsumer: (state) => {
            if (state.settings.taxReceiptEnabled) {
                updateComprobante(state, 'CONSUMIDOR FINAL');
            }
        },
        IncreaseTaxCredit: (state) => {
            if (state.settings.taxReceiptEnabled) {
                updateComprobante(state, 'CREDITO FISCAL');
            }
        },
        toggleTaxReceiptSettings: (state, action) => {
            state.settings.taxReceiptEnabled = action.payload; // Cambia el estado de activación
        },
        updateTaxCreditInFirebase: (state) => {
            const taxReceipt = state.data
            fbUpdateTaxReceipt(taxReceipt)
        },
        handleNCFStatus: (state, actions) => {
            state.ncfStatus = actions.payload
        },
        
        clearTaxReceiptData: (state) => {
            state.ncfStatus = false
            state.ncfCode = null
        }
    }
})

export const { getTaxReceiptData, clearTaxReceiptData, IncreaseEndConsumer, IncreaseTaxCredit, handleNCFStatus, updateTaxCreditInFirebase, toggleTaxReceiptSettings } = taxReceiptSlice.actions;

//selectors
export default taxReceiptSlice.reducer

export const selectTaxReceiptData = (state) => state.taxReceipt.data;
export const selectNcfStatus = (state) => state.taxReceipt.ncfStatus;
export const selectNcfCode = (state) => state.taxReceipt.ncfCode;
export const selectTaxReceiptEnabled = (state) => state.taxReceipt.settings.taxReceiptEnabled;
export const selectTaxReceipt = (state) => state.taxReceipt;