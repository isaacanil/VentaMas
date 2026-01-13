// accountsReceivableSlice.js
import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';

import { getAccountReceivableDetails } from '@/firebase/accountsReceivable/fbGetAccountReceivableDetails'; // Asegúrate de que la ruta es correcta
import { defaultAR } from '@/schema/accountsReceivable/accountsReceivable';
import { applyUpdates } from '@/utils/reduxStateUtils';

interface AccountsReceivableInfo {
  ar: Record<string, unknown>;
  client: Record<string, unknown>;
  invoice: Record<string, unknown>;
  payments: any[];
  installments: any[];
  paymentInstallment: any[];
}

interface AccountsReceivableState {
  ar: typeof defaultAR;
  arDetailsModal: {
    isOpen: boolean;
    arId: string;
  };
  info: AccountsReceivableInfo;
  loading: boolean;
  error: string | null;
}

// Estado inicial con un único objeto defaultAR
const initialState: AccountsReceivableState = {
  ar: defaultAR,
  arDetailsModal: {
    isOpen: false,
    arId: '',
  },
  info: {
    ar: {},
    client: {},
    invoice: {},
    payments: [],
    installments: [],
    paymentInstallment: [],
  },
  loading: false,
  error: null,
};

// Crear un thunk asíncrono para obtener los detalles de la cuenta por cobrar
export const fetchAccountReceivableDetails = (createAsyncThunk as any)(
  'accountsReceivable/fetchDetails',
  async ({ arId, businessID }: { arId: string; businessID: string }, { rejectWithValue }: { rejectWithValue: (value: string) => unknown }) => {
    try {
      const data = await getAccountReceivableDetails(arId, businessID);
      return data;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  },
);

const accountsReceivableSlice = createSlice({
  name: 'accountsReceivable',
  initialState,
  reducers: {
    setAR(state: AccountsReceivableState, action: PayloadAction<any>) {
      applyUpdates(state.ar, action.payload);
      console.log('AR updated:', action.payload);
    },
    setAccountReceivableInfo(state: AccountsReceivableState, action: PayloadAction<any>) {
      const { ar, payments, installments, paymentInstallments } =
        action.payload;
      if (ar) {
        state.info.ar = ar;
      }
      if (payments) {
        state.info.payments = payments;
      }
      if (installments) {
        state.info.installments = installments;
      }
      if (paymentInstallments) {
        state.info.paymentInstallment = paymentInstallments;
      }
    },
    toggleARInfoModal(state: AccountsReceivableState) {
      const isOpen = state.arDetailsModal.isOpen;
      state.arDetailsModal.isOpen = !isOpen;
      if (!isOpen) {
        state.arDetailsModal.arId = ''; // Resetar arId al cerrar
      }
    },
    setARDetailsModal(state: AccountsReceivableState, action: PayloadAction<{ isOpen: boolean; arId: string }>) {
      state.arDetailsModal.isOpen = action.payload.isOpen;
      state.arDetailsModal.arId = action.payload.arId;
    },
    resetAR(state: AccountsReceivableState) {
      state.ar = defaultAR;
      state.info = {
        ar: {},
        client: {},
        invoice: {},
        payments: [],
        installments: [],
        paymentInstallment: [],
      };
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder: any) => {
    builder
      .addCase(fetchAccountReceivableDetails.pending, (state: AccountsReceivableState) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAccountReceivableDetails.fulfilled, (state: AccountsReceivableState, action: PayloadAction<any>) => {
        state.loading = false;
        const { accountReceivable, client, invoice, installments } =
          action.payload;

        // Extraer todos los pagos de los installments
        const payments =
          installments?.reduce((allPayments: any[], installment: any) => {
            if (installment.payments && Array.isArray(installment.payments)) {
              return [
                ...allPayments,
                ...installment.payments.map((payment: any) => ({
                  ...payment,
                  installmentNumber: installment.installmentNumber,
                  installmentDate: installment.installmentDate,
                })),
              ];
            }
            return allPayments;
          }, []) || [];

        // Update ar state
        state.ar = { ...state.ar, ...accountReceivable };

        // Update info state with flattened payments
        state.info = {
          ar: accountReceivable || {},
          client: client || {},
          invoice: invoice || {},
          installments: installments || [],
          payments: payments, // Pagos aplanados con referencia al número de cuota
          paymentInstallment: [], // Si es necesario, podemos eliminarlo si no se usa
        };
      })
      .addCase(fetchAccountReceivableDetails.rejected, (state: AccountsReceivableState, action: PayloadAction<any>) => {
        state.loading = false;
        state.error =
          action.payload ||
          'Error al obtener los detalles de la cuenta por cobrar.';
      });
  },
});

export const {
  setAR,
  toggleARInfoModal,
  setARDetailsModal,
  setAccountReceivableInfo,
  resetAR,
} = accountsReceivableSlice.actions;

export default accountsReceivableSlice.reducer;

// Selectores
export const selectAR = (state: { accountsReceivable: AccountsReceivableState }) => state.accountsReceivable.ar;
export const selectARInfo = (state: { accountsReceivable: AccountsReceivableState }) => state.accountsReceivable.info;
export const selectARLoading = (state: { accountsReceivable: AccountsReceivableState }) => state.accountsReceivable.loading;
export const selectARError = (state: { accountsReceivable: AccountsReceivableState }) => state.accountsReceivable.error;
export const selectARDetailsModal = (state: { accountsReceivable: AccountsReceivableState }) =>
  state.accountsReceivable.arDetailsModal;


