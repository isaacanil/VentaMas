import { createSlice } from '@reduxjs/toolkit';

import { fbUpdateTaxReceipt } from '@/firebase/taxReceipt/fbUpdateTaxReceipt';
import { serializeFirestoreData } from '@/utils/serialization/serializeFirestoreData';

import { increaseSequence } from './increaseSequence';

export const updateComprobante = (state, name) => {
  const comprobante = state.data.find((item) => item.data.name === name);
  if (comprobante) {
    const { type, serie, sequence, increase, quantity } = comprobante.data;
    comprobante.data.quantity = String(Number(quantity) - 1);
    comprobante.data.sequence = increaseSequence(sequence, increase, 10);
    state.ncfCode = type + serie + increaseSequence(sequence, increase, 10);
  }
};

export const generateNCFCode = (receipt) => {
  if (receipt) {
    const { type, series, sequence, increase, quantity } = receipt.data;
    // Decrease the quantity
    receipt.data.quantity = String(Number(quantity) - 1);
    // Increase and format the sequence
    receipt.data.sequence = increaseSequence(sequence, increase, 10);
    // Build and assign the NCF code
    const ncfCode = type + series + increaseSequence(sequence, increase, 10);
    return ncfCode;
  }
};

export function getUpdatedSequenceForInvoice(comprobanteName, comprobantes) {
  // Encuentra el comprobante por nombre
  const comprobanteIndex = comprobantes.findIndex(
    (c) => c.data.name === comprobanteName,
  );

  // No se encontró el comprobante, manejar según sea necesario
  if (comprobanteIndex === -1) {
    return null;
  }

  // Crear una copia del comprobante para modificar
  const comprobante = { ...comprobantes[comprobanteIndex].data };

  // Actualizar la cantidad y la secuencia
  comprobante.quantity = String(Number(comprobante.quantity) - 1);
  comprobante.sequence = increaseSequence(
    comprobante.sequence,
    comprobante.increase,
  );

  // Formatear y devolver la nueva secuencia
  return `${comprobante.type}${comprobante.serie}${comprobante.sequence}`;
}

const initialState = {
  settings: {
    // Valor inicial conservador; el listener en tiempo real lo actualizará.
    taxReceiptEnabled: false,
    // Indica si ya recibimos el valor real desde Firestore (o lo hidratamos localmente)
    settingsLoaded: false,
  },
  data: [],
  ncfCode: null,
  ncfType: '',
  availableTypes: [], // Lista de tipos de comprobantes disponibles
  ncfTypeLocked: false, // Evita cambios mientras se procesa la factura
};

export const taxReceiptSlice = (createSlice as any)({
  name: 'taxReceipt',
  initialState,
  reducers: {
    getTaxReceiptData: (state, action) => {
      // Serialize the payload to ensure no Firestore timestamps remain
      const serializedPayload = serializeFirestoreData(action.payload);
      state.data = serializedPayload;
      // Actualizar la lista de tipos de comprobantes disponibles
      state.availableTypes = serializedPayload.map((item) => item.data.name);
    },
    IncreaseEndConsumer: (state, action) => {
      if (state.settings.taxReceiptEnabled) {
        // Si se proporciona un nombre específico del comprobante, usar ese
        const name = action.payload || 'CONSUMIDOR FINAL';
        updateComprobante(state, name);
      }
    },
    IncreaseTaxCredit: (state, action) => {
      if (state.settings.taxReceiptEnabled) {
        // Si se proporciona un nombre específico del comprobante, usar ese
        const name = action.payload || 'CREDITO FISCAL';
        updateComprobante(state, name);
      }
    },
    // Nuevo action para aumentar cualquier comprobante por su nombre
    IncreaseSpecificReceipt: (state, action) => {
      if (state.settings.taxReceiptEnabled && action.payload) {
        updateComprobante(state, action.payload);
      }
    },
    toggleTaxReceiptSettings: (state, action) => {
      const enabled = !!action.payload;
      state.settings.taxReceiptEnabled = enabled; // Cambia el estado de activación
      state.settings.settingsLoaded = true;
      try {
        // Persistimos para hidratar en cargas directas posteriores
        localStorage.setItem('taxReceiptEnabled', JSON.stringify(enabled));
      } catch {
        // ignore storage errors (private mode, etc.)
      }
    },
    setTaxReceiptSettingsLoaded: (state, action) => {
      state.settings.settingsLoaded = !!action.payload;
    },
    updateTaxCreditInFirebase: (state) => {
      const taxReceipt = state.data;
      (fbUpdateTaxReceipt as any)(taxReceipt);
    },
    selectTaxReceiptType: (state, actions) => {
      // Evitar cambiar el comprobante mientras está bloqueado
      if (state.ncfTypeLocked) return;
      state.ncfType = actions.payload;
    },
    clearTaxReceiptData: (state) => {
      state.ncfStatus = false;
      state.ncfCode = null;
      // Al limpiar datos aseguramos desbloqueo
      state.ncfTypeLocked = false;
    },
    lockTaxReceiptType: (state) => {
      state.ncfTypeLocked = true;
    },
    unlockTaxReceiptType: (state) => {
      state.ncfTypeLocked = false;
    },
  },
});

export const {
  getTaxReceiptData,
  clearTaxReceiptData,
  IncreaseEndConsumer,
  IncreaseTaxCredit,
  IncreaseSpecificReceipt,
  selectTaxReceiptType,
  updateTaxCreditInFirebase,
  toggleTaxReceiptSettings,
  setTaxReceiptSettingsLoaded,
  lockTaxReceiptType,
  unlockTaxReceiptType,
} = taxReceiptSlice.actions;

//selectors
export default taxReceiptSlice.reducer;

export const selectTaxReceiptData = (state) => state.taxReceipt.data;
export const selectNcfType = (state) => state.taxReceipt.ncfType;
export const selectNcfCode = (state) => state.taxReceipt.ncfCode;
export const selectTaxReceiptEnabled = (state) =>
  state.taxReceipt.settings.taxReceiptEnabled;
export const selectTaxReceiptSettingsLoaded = (state) =>
  state.taxReceipt.settings.settingsLoaded;
export const selectTaxReceipt = (state) => state.taxReceipt;
export const selectAvailableReceiptTypes = (state) =>
  state.taxReceipt.availableTypes;
export const selectNcfTypeLocked = (state) => state.taxReceipt.ncfTypeLocked;

