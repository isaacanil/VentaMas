import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { getLastInstallmentAmountByArId } from '@/firebase/accountsReceivable/installment/getLastInstallmentAmountByArId';

const paymentDetailsTemplate = {
  paymentScope: 'balance', // Tipo de pago (cuota, balance de cuenta, abono) account
  paymentOption: 'installment', // Subtipo de pago ('cuota', 'abono' cuando tipo es 'cuenta')
  clientId: '', // ID del cliente
  arId: '', // ID de la cuenta por cobrar
  paymentMethods: [
    {
      method: 'cash',
      value: 0,
      status: true,
    },
    {
      method: 'card',
      value: 0,
      reference: '',
      status: false,
    },
    {
      method: 'transfer',
      value: 0,
      reference: '',
      status: false,
    },
    {
      method: 'creditNote',
      value: 0,
      status: false,
    },
  ],
  comments: '', // Comentarios
  totalAmount: 0.0, // Monto total a pagar
  totalPaid: 0.0, // Monto total pagado
  printReceipt: true, // Si se debe imprimir el recibo de pago
  creditNotePayment: [], // Notas de crÃ©dito aplicadas
};

const createDefaultPaymentDetails = (amount = 0) => {
  const methods = paymentDetailsTemplate.paymentMethods.map((method) => ({
    ...method,
  }));

  // Prefill cash with the amount to pay; keep others off
  const cashIndex = methods.findIndex((m) => m.method === 'cash');
  if (cashIndex !== -1) {
    methods[cashIndex] = {
      ...methods[cashIndex],
      value: amount,
      status: amount > 0,
    };
  }

  return {
    ...paymentDetailsTemplate,
    totalAmount: amount,
    totalPaid: amount > 0 ? amount : 0,
    paymentMethods: methods,
    creditNotePayment: [],
  };
};

const initialState = {
  isOpen: false,
  paymentDetails: createDefaultPaymentDetails(),
  error: null, // Para manejar errores
  isValid: true, // Para manejar validaciones
  methodErrors: {},
  extra: null, // Para manejar informaciÃ³n adicional
  installment: null,
};

// Thunk to fetch last installment amount
export const fetchLastInstallmentAmount = (createAsyncThunk as any)(
  'accountsReceivablePayment/fetchLastInstallmentAmount',
  async ({ user, arId }, { rejectWithValue }) => {
    try {
      const lastInstallmentAmount = await getLastInstallmentAmountByArId(
        user,
        arId,
      );
      return { arId, lastInstallmentAmount };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const accountsReceivablePaymentSlice = createSlice({
  name: 'accountsReceivablePayment',
  initialState,
  reducers: {
    openPaymentModal: (state: any) => {
      state.isOpen = true;
    },
    closePaymentModal: (state: any) => {
      state.isOpen = false;
      state.paymentDetails = createDefaultPaymentDetails();
      state.error = null;
      state.isValid = true;
      state.methodErrors = {};
      state.extra = null;
    },
    setPaymentDetails: (state: any, action: PayloadAction<any>) => {
      state.paymentDetails = {
        ...state.paymentDetails,
        ...action.payload,
      };
    },
    setPaymentOption: (state: any, action: PayloadAction<any>) => {
      const { paymentOption } = action.payload;
      state.paymentDetails.paymentOption = paymentOption;
      if (
        state.paymentDetails.paymentScope === 'account' &&
        state.paymentDetails.paymentOption === 'installment'
      ) {
        state.paymentDetails.totalAmount = state.extra.installmentAmount;
      } else if (state.paymentDetails.paymentScope === 'account') {
        state.paymentDetails.totalAmount = state.extra.arBalance;
      }
    },
    setAccountPayment: (state: any, action: PayloadAction<any>) => {
      const {
        isOpen,
        paymentDetails: paymentDetailsPayload,
        error,
        isValid,
        methodErrors,
        extra,
      } =
        action.payload;
      const opening = isOpen === true && state.isOpen === false;

      if (opening) {
        const incomingAmount =
          paymentDetailsPayload?.totalAmount ??
          paymentDetailsPayload?.balance ??
          state.extra?.installmentAmount ??
          0;
        state.paymentDetails = createDefaultPaymentDetails(incomingAmount);
        state.methodErrors = {};
        state.error = null;
        state.isValid = true;
      }

      if (isOpen !== undefined) state.isOpen = isOpen;
      if (paymentDetailsPayload !== undefined) {
        state.paymentDetails = {
          ...state.paymentDetails,
          ...paymentDetailsPayload,
          paymentMethods:
            paymentDetailsPayload.paymentMethods ||
            state.paymentDetails.paymentMethods,
        };
      }
      if (extra !== undefined) state.extra = extra;
      if (error !== undefined) state.error = error;
      if (isValid !== undefined) state.isValid = isValid;
      if (methodErrors !== undefined) state.methodErrors = methodErrors;
      if (
        state.paymentDetails.paymentScope === 'account' &&
        state.paymentDetails.paymentOption === 'installment'
      ) {
        state.paymentDetails.totalAmount =
          state.extra?.installmentAmount || state.paymentDetails.totalAmount;
      } else if (paymentDetailsPayload?.totalAmount !== undefined) {
        state.paymentDetails.totalAmount = paymentDetailsPayload.totalAmount;
      }

      // Recalcular total pagado con los mÃ©todos vigentes
      state.paymentDetails.totalPaid = state.paymentDetails.paymentMethods
        ? state.paymentDetails.paymentMethods.reduce((sum, method) => {
            return method.status ? sum + (Number(method.value) || 0) : sum;
          }, 0.0)
        : 0.0;
    },
    updatePaymentMethod: (state: any, action: PayloadAction<any>) => {
      const { method, key, value } = action.payload;
      const methodIndex = state.paymentDetails.paymentMethods.findIndex(
        (m) => m.method === method,
      );
      if (methodIndex !== -1) {
        const paymentMethod = state.paymentDetails.paymentMethods[methodIndex];

        // Si la clave es 'reference' y el mÃ©todo es 'cash' o 'creditNote', no asignar el valor
        if (
          !(
            key === 'reference' &&
            (method === 'cash' || method === 'creditNote')
          )
        ) {
          paymentMethod[key] = value;
        }
        // Recalculate totalPaid only if the method is active
        state.paymentDetails.totalPaid =
          state.paymentDetails.paymentMethods.reduce((total, method) => {
            return method.status ? total + method.value : total;
          }, 0.0);
      }
    },
    setError: (state: any, action: PayloadAction<any>) => {
      state.error = action.payload;
    },
    setIsValid: (state: any, action: PayloadAction<any>) => {
      state.isValid = action.payload;
    },
    setMethodError: (state: any, action: PayloadAction<any>) => {
      const { method, key, error } = action.payload;
      state.methodErrors[`${method}_${key}`] = error;
    },
    clearMethodErrors: (state: any, action: PayloadAction<any>) => {
      const { method } = action.payload;
      delete state.methodErrors[`${method}_value`];
      delete state.methodErrors[`${method}_reference`];
    },
    setCreditNotePayment: (state: any, action: PayloadAction<any>) => {
      const creditNoteSelections = action.payload || [];

      // Calcular total aplicado
      const totalCreditNoteAmount = creditNoteSelections.reduce(
        (sum, sel) => sum + (sel.amountToUse || 0),
        0,
      );

      // Calcular total de otros mÃ©todos activos
      const totalOtherPayments = state.paymentDetails.paymentMethods
        .filter((m) => m.status && m.method !== 'creditNote')
        .reduce((sum, m) => sum + (Number(m.value) || 0), 0);

      const totalDue = state.paymentDetails.totalAmount || 0;
      const remainingToPay = Math.max(0, totalDue - totalOtherPayments);
      const validAmount = Math.min(totalCreditNoteAmount, remainingToPay);

      // Transformar y guardar detalle en paymentDetails con estructura estandarizada
      state.paymentDetails.creditNotePayment = creditNoteSelections
        .filter((sel) => sel.amountToUse > 0)
        .map((sel) => ({
          id: sel.id,
          ncf: sel.creditNote?.ncf || sel.creditNote?.number || '',
          amountUsed: sel.amountToUse,
          originalAmount: sel.creditNote?.totalAmount || 0,
        }));

      // Actualizar mÃ©todo de pago creditNote
      const idx = state.paymentDetails.paymentMethods.findIndex(
        (m) => m.method === 'creditNote',
      );
      if (idx !== -1) {
        state.paymentDetails.paymentMethods[idx] = {
          ...state.paymentDetails.paymentMethods[idx],
          value: validAmount,
          status: validAmount > 0,
        };
      } else {
        state.paymentDetails.paymentMethods.push({
          method: 'creditNote',
          name: 'Notas de CrÃ©dito',
          value: validAmount,
          status: validAmount > 0,
        });
      }

      // Recalcular totalPaid
      state.paymentDetails.totalPaid =
        state.paymentDetails.paymentMethods.reduce(
          (sum, m) => (m.status ? sum + (Number(m.value) || 0) : sum),
          0,
        );
    },
    clearCreditNotePayment: (state: any) => {
      state.paymentDetails.creditNotePayment = [];
      const idx = state.paymentDetails.paymentMethods.findIndex(
        (m) => m.method === 'creditNote',
      );
      if (idx !== -1) {
        state.paymentDetails.paymentMethods[idx] = {
          ...state.paymentDetails.paymentMethods[idx],
          value: 0,
          status: false,
        };
      }
      state.paymentDetails.totalPaid =
        state.paymentDetails.paymentMethods.reduce(
          (sum, m) => (m.status ? sum + (Number(m.value) || 0) : sum),
          0,
        );
    },
  },
  extraReducers: (builder: any) => {
    builder
      .addCase(fetchLastInstallmentAmount.fulfilled, (state, action) => {
        const { arId, lastInstallmentAmount } = action.payload;
        if (state.paymentDetails.arId === arId) {
          state.extra = {
            ...state.extra,
            installmentAmount: lastInstallmentAmount,
          };
          if (state.paymentDetails.paymentOption === 'installment') {
            state.paymentDetails.totalAmount = lastInstallmentAmount;
          }
        }
      })
      .addCase(fetchLastInstallmentAmount.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
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
  clearMethodErrors,
  setCreditNotePayment,
  clearCreditNotePayment,
} = accountsReceivablePaymentSlice.actions;

export default accountsReceivablePaymentSlice.reducer;

export const selectAccountsReceivablePayment = (state) =>
  state.accountsReceivablePayment;


