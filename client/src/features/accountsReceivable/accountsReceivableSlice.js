import { createSlice } from '@reduxjs/toolkit';
import { defaultAR } from '../../schema/accountsReceivable/accountsReceivable';
import { DateTime } from 'luxon';

// Estado inicial con un único objeto defaultAR
const initialState = {
    ar: defaultAR,
};

const accountsReceivableSlice = createSlice({
    name: 'accountsReceivable',
    initialState,
    reducers: {
        setAR(state, action) {
            const ar = action.payload;
            state.ar = {...state.ar, ...ar}
            state.ar.updatedAt = DateTime.now().toMillis();
        },
        updateInvoiceId(state, action) {
            state.ar.invoiceId = action.payload;
        },
        updateClientId(state, action) {
            state.ar.clientId = action.payload;
        },
        updateFrequency(state, action) {
            state.ar.paymentFrequency = action.payload;
        },
        updateDues(state, action) {
            state.ar.totalInstallments = action.payload;
        },
        updateAmountByDue(state, action) {
            state.ar.installmentAmount = action.payload;
        },
        updateComments(state, action) {
            state.ar.comments = action.payload;
        },
        toggleIsClosed(state) {
            state.ar.isClosed = !state.ar.isClosed;
        },
        toggleActiveStatus(state) {
            state.ar.isActive = !state.ar.activeStatus;
        },
        resetAR(state) {
            state.ar = defaultAR
        }
    },
});

export const { setAR, updateARFrequency, updateARDues, updateARAmountByDue, updateComments, toggleIsClosed, toggleActiveStatus, resetAR } = accountsReceivableSlice.actions;

export default accountsReceivableSlice.reducer;

export const selectAR = state => state.accountsReceivable.ar;