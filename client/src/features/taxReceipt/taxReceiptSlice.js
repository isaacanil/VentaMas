import { createSlice } from '@reduxjs/toolkit'
import { diminishSequence } from './diminishSequence'
import { increaseSequence } from './increaseSequence'
import { fbUpdateTaxReceipt } from '../../firebase/taxReceipt/fbUpdateTaxReceipt'

const initialState = {
    data: [],
    ncfCode: null,
    ncfStatus: false
}

export const taxReceiptSlice = createSlice({
    name: 'taxReceipt',
    initialState,
    reducers: {
        getTaxReceiptData: (state, action) => {          
            state.data = action.payload
        },
        IncreaseEndConsumer: (state) => {
            const endConsumer = state.data.find((item) => item.data.name === 'CONSUMIDOR FINAL')
            
            if (state.data.length > 0 && endConsumer) {
                const {type, serie, sequence, increase, quantity} = endConsumer.data
                endConsumer.data.quantity = String(Number(quantity) - 1)
                endConsumer.data.sequence = increaseSequence(sequence, increase, 10)
                state.ncfCode = type + serie + increaseSequence(sequence, increase, 10) 
              
            }
        },
        IncreaseTaxCredit: (state) => {
            const taxCredit = state.data.find((item) => item.data.name === 'CREDITO FISCAL')
            if (state.data.length > 0 && taxCredit) {
                const {type, serie, sequence, increase, quantity} = taxCredit.data
                taxCredit.data.quantity = String(Number(quantity) - 1)
                taxCredit.data.sequence = increaseSequence(sequence, increase, 10)
                state.ncfCode = type + serie + increaseSequence(sequence, increase, 10) 
            }
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

export const { getTaxReceiptData, clearTaxReceiptData, IncreaseEndConsumer, IncreaseTaxCredit, handleNCFStatus, updateTaxCreditInFirebase } = taxReceiptSlice.actions;

//selectors
export default taxReceiptSlice.reducer

export const selectTaxReceiptData = (state) => state.taxReceipt.data;
export const selectNcfStatus = (state) => state.taxReceipt.ncfStatus;
export const selectNcfCode = (state) => state.taxReceipt.ncfCode;