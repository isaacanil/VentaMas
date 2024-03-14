import { createSlice } from '@reduxjs/toolkit'
import { diminishSequence } from './diminishSequence'
import { increaseSequence } from './increaseSequence'
import { fbUpdateTaxReceipt } from '../../firebase/taxReceipt/fbUpdateTaxReceipt'
import { useEffect } from 'react'
import { useState } from 'react'

const updateComprobante = (state, name) => {
    const comprobante = state.data.find((item) => item.data.name === name);
    if (comprobante) {
        const {type, serie, sequence, increase, quantity} = comprobante.data;
        comprobante.data.quantity = String(Number(quantity) - 1);
        comprobante.data.sequence = increaseSequence(sequence, increase, 10);
        state.ncfCode = type + serie + increaseSequence(sequence, increase, 10);
    }
}
export function getUpdatedSequenceForInvoice(comprobanteName, comprobantes) {
    // Encuentra el comprobante por nombre
    const comprobanteIndex = comprobantes.findIndex(c => c.data.name === comprobanteName);

    if (comprobanteIndex === -1) {
        // No se encontró el comprobante, manejar según sea necesario
        return null;
    }

    // Crear una copia del comprobante para modificar
    const comprobante = { ...comprobantes[comprobanteIndex].data };

    // Actualizar la cantidad y la secuencia
    comprobante.quantity = String(Number(comprobante.quantity) - 1);
    comprobante.sequence = increaseSequence(comprobante.sequence, comprobante.increase);

    // Formatear y devolver la nueva secuencia
    return `${comprobante.type}${comprobante.serie}${comprobante.sequence}`;
}

// Función para aumentar la secuencia
// function increaseSequence(sequence, increase) {
//     // Convierte la secuencia a número, incrementa y luego vuelve a formatear como string
//     const newSequence = parseInt(sequence, 10) + increase;
//     return newSequence.toString().padStart(sequence.length, '0');
// }

const initialState = {
    settings: {
        taxReceiptEnabled: false,
    },
    data: [],
    ncfCode: null,
    ncfType: "",
}

export const taxReceiptSlice = createSlice({
    name: 'taxReceipt',
    initialState,
    reducers: {
        getTaxReceiptData: (state, action) => {          
            state.data = action.payload
        },
        IncreaseEndConsumer: (state, action) => {
            const name = action.payload;
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
        selectTaxReceiptType: (state, actions) => {
            state.ncfType = actions.payload;
        },
        
        clearTaxReceiptData: (state) => {
            state.ncfStatus = false
            state.ncfCode = null
        }
    }
})

export const { getTaxReceiptData, clearTaxReceiptData, IncreaseEndConsumer, IncreaseTaxCredit, selectTaxReceiptType, updateTaxCreditInFirebase, toggleTaxReceiptSettings } = taxReceiptSlice.actions;

//selectors
export default taxReceiptSlice.reducer

export const selectTaxReceiptData = (state) => state.taxReceipt.data;
export const selectNcfType = (state) => state.taxReceipt.ncfType;
export const selectNcfCode = (state) => state.taxReceipt.ncfCode;
export const selectTaxReceiptEnabled = (state) => state.taxReceipt.settings.taxReceiptEnabled;
export const selectTaxReceipt = (state) => state.taxReceipt;
