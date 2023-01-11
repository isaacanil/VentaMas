import { createSlice } from '@reduxjs/toolkit'
import { diminishSequence } from './diminishSequence'
import { increaseSequence } from './increaseSequence'
import { updateTaxReceiptDataBD } from '../../firebase/firebaseconfig'
const initialState = {
    data: [],
    NCF_code: null,
    NCF_status: false
}

export const taxReceiptSlice = createSlice({
    name: 'taxReceipt',
    initialState,
    reducers: {
        getTaxReceiptData: (state, action) => {
            //console.log(action.payload)           
            state.data = action.payload
        },
        IncreaseEndConsumer: (state) => {
            const endConsumer = state.data.find((item) => item.name === 'CONSUMIDOR FINAL')
            if (state.data.length > 0 && endConsumer) {
                const {type, serie, sequence, increase, quantity} = endConsumer 
                endConsumer.quantity = String(Number(quantity) - 1)
                endConsumer.sequence = increaseSequence(sequence, increase, 10)
                state.NCF_code = type + serie + increaseSequence(sequence, increase, 10) 
            }
        },
        IncreaseTaxCredit: (state) => {
            const taxCredit = state.data.find((item) => item.name === 'CREDITO FISCAL')
            if (state.data.length > 0 && taxCredit) {
                const {type, serie, sequence, increase, quantity} = taxCredit 
                taxCredit.quantity = String(Number(quantity) - 1)
                taxCredit.sequence = increaseSequence(sequence, increase, 10)
                state.NCF_code = type + serie + increaseSequence(sequence, increase, 10) 
            }
        },
        updateTaxCreditInFirebase: (state) => {
            const taxReceipt = state.data
            updateTaxReceiptDataBD(taxReceipt)
        },
        handleNCFStatus: (state, actions) => {
            state.NCF_status = actions.payload
        },
        clearTaxReceiptData: (state) => {
            state.NCF_status = false
        }
    }
})

export const { getTaxReceiptData, clearTaxReceiptData, IncreaseEndConsumer, IncreaseTaxCredit, handleNCFStatus, updateTaxCreditInFirebase } = taxReceiptSlice.actions;

//selectors
export default taxReceiptSlice.reducer

export const selectTaxReceiptData = (state) => state.taxReceipt.data;
export const SELECT_NCF_STATUS = (state) => state.taxReceipt.NCF_status;
export const SELECT_NCF_CODE = (state) => state.taxReceipt.NCF_code;