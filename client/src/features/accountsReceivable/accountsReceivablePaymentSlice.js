import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getLastInstallmentAmountByArId } from '../../firebase/accountsReceivable/installment/getLastInstallmentAmountByArId';

const paymentDetails = {
  paymentScope: 'balance', // Tipo de pago (cuota, balance de cuenta, abono) account
  paymentOption: 'installment', // Subtipo de pago ('cuota', 'abono' cuando tipo es 'cuenta')
  clientId: "", // ID del cliente
  arId: "", // ID de la cuenta por cobrar
  paymentMethods: [
    {
      method: "cash",
      value: 0,
      status: true
    },
    {
      method: "card",
      value: 0,
      reference: "",
      status: false
    },
    {
      method: "transfer",
      value: 0,
      reference: "",
      status: false
    }
  ],
  comments: "", // Comentarios
  totalAmount: 0.00, // Monto total a pagar
  totalPaid: 0.00, // Monto total pagado
  printReceipt: true, // Si se debe imprimir el recibo de pago
}

const initialState = {
  isOpen: false,
  paymentDetails: { ...paymentDetails },
  error: null, // Para manejar errores
  isValid: true, // Para manejar validaciones
  methodErrors: {},
  extra: null, // Para manejar información adicional
  installment: null
};

// Thunk to fetch last installment amount
export const fetchLastInstallmentAmount = createAsyncThunk(
  'accountsReceivablePayment/fetchLastInstallmentAmount',
  async ({ user, arId }, { rejectWithValue }) => {
    try {
      const lastInstallmentAmount = await getLastInstallmentAmountByArId(user, arId);
      return { arId, lastInstallmentAmount };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const accountsReceivablePaymentSlice = createSlice({
  name: 'accountsReceivablePayment',
  initialState,
  reducers: {
    openPaymentModal: (state) => {
      state.isOpen = true;
    },
    closePaymentModal: (state) => {
      state.isOpen = false;
      state.paymentDetails = {...paymentDetails};
      state.error = null;
      state.isValid = true;
      state.methodErrors = {};
      state.extra = null;
    },
    setPaymentDetails: (state, action) => {
      state.paymentDetails = {
        ...state.paymentDetails,
        ...action.payload
      };
    },
    setPaymentOption: (state, action) => {
      const { paymentOption } = action.payload;
      state.paymentDetails.paymentOption = paymentOption;
      if (state.paymentDetails.paymentScope === 'account' && state.paymentDetails.paymentOption === 'installment' ) {
        state.paymentDetails.totalAmount = state.extra.installmentAmount;
      } else if (state.paymentDetails.paymentScope === 'account')  {
        state.paymentDetails.totalAmount = state.extra.arBalance;
      }
    },
    setAccountPayment: (state, action) => {
      const { isOpen, paymentDetails, error, isValid, methodErrors, extra } = action.payload;
      if (isOpen !== undefined) state.isOpen = isOpen;
      if (paymentDetails !== undefined) state.paymentDetails = { ...state.paymentDetails, ...paymentDetails };
      if (extra !== undefined) state.extra = extra;
      if (error !== undefined) state.error = error;
      if (isValid !== undefined) state.isValid = isValid;
      if (methodErrors !== undefined) state.methodErrors = methodErrors;
      if (state.paymentDetails.paymentScope === 'account' && state.paymentDetails.paymentOption === 'installment') {
        state.paymentDetails.totalAmount = state.extra.installmentAmount;
      } else {
        state.paymentDetails.totalAmount = paymentDetails.totalAmount;
      }
    },
    updatePaymentMethod: (state, action) => {
      const { method, key, value } = action.payload;
      const methodIndex = state.paymentDetails.paymentMethods.findIndex(m => m.method === method);
      if (methodIndex !== -1) {
        const paymentMethod = state.paymentDetails.paymentMethods[methodIndex];

        // Si la clave es 'reference' y el método es 'cash', no asignar el valor
        if (!(key === 'reference' && method === 'cash')) {
          paymentMethod[key] = value;
        }
        // Recalculate totalPaid only if the method is active
        state.paymentDetails.totalPaid = state.paymentDetails.paymentMethods.reduce((total, method) => {
          return method.status ? total + method.value : total;
        }, 0.00);
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setIsValid: (state, action) => {
      state.isValid = action.payload;
    },
    setMethodError: (state, action) => {
      const { method, key, error } = action.payload;
      state.methodErrors[`${method}_${key}`] = error;
    },
    clearMethodErrors: (state, action) => {
      const { method } = action.payload;
      delete state.methodErrors[`${method}_value`];
      delete state.methodErrors[`${method}_reference`];
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLastInstallmentAmount.fulfilled, (state, action) => {
        const { arId, lastInstallmentAmount } = action.payload;
        if (state.paymentDetails.arId === arId) {
          state.extra = { ...state.extra, installmentAmount: lastInstallmentAmount };
          if (state.paymentDetails.paymentOption === 'installment') {
            state.paymentDetails.totalAmount = lastInstallmentAmount;
          }
        }
      })
      .addCase(fetchLastInstallmentAmount.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const {
  openPaymentModal,
  closePaymentModal,
  setPaymentDetails,
  setAccountPayment,
  setPaymentOption,
  updatePaymentMethod,
  setError,
  setIsValid,
  setMethodError,
  clearMethodErrors
} = accountsReceivablePaymentSlice.actions;

export default accountsReceivablePaymentSlice.reducer;

export const selectAccountsReceivablePayment = (state) => state.accountsReceivablePayment;

