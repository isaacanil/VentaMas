// accountsReceivableSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { defaultAR } from '../../schema/accountsReceivable/accountsReceivable';
import { DateTime } from 'luxon';
import { getAccountReceivableDetails } from '../../firebase/accountsReceivable/fbGetAccountReceivableDetails'; // Asegúrate de que la ruta es correcta

// Estado inicial con un único objeto defaultAR
const initialState = {
    ar: defaultAR,
    arDetailsModal: {
        isOpen: false,
        arId: ""
    },
    info: {
        ar: {},
        client: {},
        invoice: {},
        payments: [],
        installments: [],
        paymentInstallment: []
    },
    loading: false,
    error: null
};

// Crear un thunk asíncrono para obtener los detalles de la cuenta por cobrar
export const fetchAccountReceivableDetails = createAsyncThunk(
    'accountsReceivable/fetchDetails',
    async ({ arId, businessID }, { rejectWithValue }) => {
        try {
            const data = await getAccountReceivableDetails(arId, businessID);
            return data;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const accountsReceivableSlice = createSlice({
    name: 'accountsReceivable',
    initialState,
    reducers: {
        setAR(state, action) {
            const ar = action.payload;
            state.ar = { ...state.ar, ...ar };
            state.ar.updatedAt = DateTime.now().toMillis();
        },
        setAccountReceivableInfo(state, action) {
            const { ar, payments, installments, paymentInstallments } = action.payload;
            if(ar){ state.info.ar = ar }
            if(payments){ state.info.payments = payments }
            if(installments){ state.info.installments = installments }
            if(paymentInstallments){ state.info.paymentInstallment = paymentInstallments }
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
            state.ar.isActive = !state.ar.isActive;
        },
        toggleARInfoModal(state){
            const isOpen = state.arDetailsModal.isOpen;
            state.arDetailsModal.isOpen = !isOpen;
            if (!isOpen) {
                state.arDetailsModal.arId = ""; // Resetar arId al cerrar
            }
        },
        setARDetailsModal(state, action) {
            state.arDetailsModal.isOpen = action.payload.isOpen;
            state.arDetailsModal.arId = action.payload.arId;
        },
        resetAR(state) {
            state.ar = defaultAR;
            state.info = {
                ar: {},
                client: {},
                invoice: {},
                payments: [],
                installments: [],
                paymentInstallment: []
            };
            state.loading = false;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccountReceivableDetails.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAccountReceivableDetails.fulfilled, (state, action) => {
                state.loading = false;
                const { accountReceivable, client, invoice, installments } = action.payload;
                
                // Extraer todos los pagos de los installments
                const payments = installments?.reduce((allPayments, installment) => {
                    if (installment.payments && Array.isArray(installment.payments)) {
                        return [...allPayments, ...installment.payments.map(payment => ({
                            ...payment,
                            installmentNumber: installment.installmentNumber,
                            installmentDate: installment.installmentDate
                        }))];
                    }
                    return allPayments;
                }, []) || [];

                // Update ar state
                state.ar = { ...state.ar, ...accountReceivable };
                
                // Update info state with flattened payments
                state.info = {
                    ar: accountReceivable || {},
                    client: client?.client || {},
                    invoice: invoice?.data || {},
                    installments: installments || [],
                    payments: payments, // Pagos aplanados con referencia al número de cuota
                    paymentInstallment: [] // Si es necesario, podemos eliminarlo si no se usa
                };
            })
            .addCase(fetchAccountReceivableDetails.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Error al obtener los detalles de la cuenta por cobrar.';
            });
    },
});

export const { 
    setAR, 
    toggleARInfoModal, 
    setARDetailsModal,
    updateFrequency, 
    setAccountReceivableInfo, 
    updateDues, 
    updateAmountByDue, 
    updateComments, 
    toggleIsClosed, 
    toggleActiveStatus, 
    resetAR 
} = accountsReceivableSlice.actions;

export default accountsReceivableSlice.reducer;

// Selectores
export const selectAR = state => state.accountsReceivable.ar;
export const selectARInfo = state => state.accountsReceivable.info;
export const selectARLoading = state => state.accountsReceivable.loading;
export const selectARError = state => state.accountsReceivable.error;
export const selectARDetailsModal = state => state.accountsReceivable.arDetailsModal;
