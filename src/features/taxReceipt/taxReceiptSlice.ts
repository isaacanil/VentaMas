import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { serializeFirestoreData } from '@/utils/serialization/serializeFirestoreData';
import { hydrateTaxReceiptData } from '@/utils/taxReceipt';

import { increaseSequence } from './increaseSequence';

interface TaxReceiptItem {
  name: string;
  type: string;
  serie?: string;
  series?: string;
  documentFormat?: 'traditional' | 'electronic';
  fiscalSeries?: string;
  fiscalType?: string;
  authorityStatus?: string | null;
  trackId?: string | null;
  sequence: string;
  increase: number;
  quantity: string;
}

interface TaxReceiptData {
  data: TaxReceiptItem;
}

interface TaxReceiptState {
  settings: {
    taxReceiptEnabled: boolean;
    settingsLoaded: boolean;
  };
  data: TaxReceiptData[];
  ncfCode: string | null;
  ncfType: string;
  ncfStatus?: boolean;
  availableTypes: string[];
  ncfTypeLocked: boolean;
}

interface TaxReceiptRootState {
  taxReceipt: TaxReceiptState;
}

export const updateComprobante = (state: TaxReceiptState, name: string) => {
  // LEGACY UI state only. This must not be treated as authoritative numbering.
  const comprobante = state.data.find((item) => item.data.name === name);
  if (comprobante) {
    const { type, serie, sequence, increase, quantity } = comprobante.data;
    comprobante.data.quantity = String(Number(quantity) - 1);
    comprobante.data.sequence = increaseSequence(sequence, increase, 10);
    state.ncfCode =
      type + (serie || '') + increaseSequence(sequence, increase, 10);
  }
};

export const generateNCFCode = (receipt: TaxReceiptData | null) => {
  if (receipt) {
    // LEGACY/PREVIEW ONLY. Backend must own real sequence reservation.
    const { type, series, sequence, increase, quantity } = receipt.data;
    // Decrease the quantity
    receipt.data.quantity = String(Number(quantity) - 1);
    // Increase and format the sequence
    receipt.data.sequence = increaseSequence(sequence, increase, 10);
    // Build and assign the NCF code
    const ncfCode =
      type + (series || '') + increaseSequence(sequence, increase, 10);
    return ncfCode;
  }
};

export function getUpdatedSequenceForInvoice(
  comprobanteName: string,
  comprobantes: TaxReceiptData[],
) {
  // Preview helper only. Do not use this to persist fiscal numbering.
  // Encuentra el comprobante por nombre
  const comprobanteIndex = comprobantes.findIndex(
    (c: TaxReceiptData) => c.data.name === comprobanteName,
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
  return `${comprobante.type}${comprobante.serie || comprobante.series || ''}${comprobante.sequence}`;
}

const initialState: TaxReceiptState = {
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

export const taxReceiptSlice = createSlice({
  name: 'taxReceipt',
  initialState,
  reducers: {
    getTaxReceiptData: (state: TaxReceiptState, action: PayloadAction<any>) => {
      // Serialize the payload to ensure no Firestore timestamps remain
      const serializedPayload = serializeFirestoreData(action.payload);
      state.data = serializedPayload.map((item: TaxReceiptData) => ({
        ...item,
        data: hydrateTaxReceiptData(item.data),
      }));
      // Actualizar la lista de tipos de comprobantes disponibles
      state.availableTypes = state.data.map(
        (item: TaxReceiptData) => item.data.name,
      );
    },
    IncreaseEndConsumer: (
      state: TaxReceiptState,
      action: PayloadAction<string | undefined>,
    ) => {
      if (state.settings.taxReceiptEnabled) {
        // Si se proporciona un nombre específico del comprobante, usar ese
        const name = action.payload || 'CONSUMIDOR FINAL';
        updateComprobante(state, name);
      }
    },
    IncreaseTaxCredit: (
      state: TaxReceiptState,
      action: PayloadAction<string | undefined>,
    ) => {
      if (state.settings.taxReceiptEnabled) {
        // Si se proporciona un nombre específico del comprobante, usar ese
        const name = action.payload || 'CREDITO FISCAL';
        updateComprobante(state, name);
      }
    },
    // Nuevo action para aumentar cualquier comprobante por su nombre
    IncreaseSpecificReceipt: (
      state: TaxReceiptState,
      action: PayloadAction<string | undefined>,
    ) => {
      if (state.settings.taxReceiptEnabled && action.payload) {
        updateComprobante(state, action.payload);
      }
    },
    toggleTaxReceiptSettings: (
      state: TaxReceiptState,
      action: PayloadAction<boolean>,
    ) => {
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
    setTaxReceiptSettingsLoaded: (
      state: TaxReceiptState,
      action: PayloadAction<boolean>,
    ) => {
      state.settings.settingsLoaded = !!action.payload;
    },
    selectTaxReceiptType: (
      state: TaxReceiptState,
      actions: PayloadAction<string>,
    ) => {
      // Evitar cambiar el comprobante mientras está bloqueado
      if (state.ncfTypeLocked) return;
      state.ncfType = actions.payload;
    },
    clearTaxReceiptData: (state: TaxReceiptState) => {
      state.ncfStatus = false;
      state.ncfCode = null;
      // Al limpiar datos aseguramos desbloqueo
      state.ncfTypeLocked = false;
    },
    lockTaxReceiptType: (state: TaxReceiptState) => {
      state.ncfTypeLocked = true;
    },
    unlockTaxReceiptType: (state: TaxReceiptState) => {
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
  toggleTaxReceiptSettings,
  setTaxReceiptSettingsLoaded,
  lockTaxReceiptType,
  unlockTaxReceiptType,
} = taxReceiptSlice.actions;

//selectors
export default taxReceiptSlice.reducer;

export const selectTaxReceiptData = (state: TaxReceiptRootState) =>
  state.taxReceipt.data;
export const selectNcfType = (state: TaxReceiptRootState) =>
  state.taxReceipt.ncfType;
export const selectNcfCode = (state: TaxReceiptRootState) =>
  state.taxReceipt.ncfCode;
export const selectTaxReceiptEnabled = (state: TaxReceiptRootState) =>
  state.taxReceipt.settings.taxReceiptEnabled;
export const selectTaxReceiptSettingsLoaded = (state: TaxReceiptRootState) =>
  state.taxReceipt.settings.settingsLoaded;
export const selectTaxReceipt = (state: TaxReceiptRootState) =>
  state.taxReceipt;
export const selectAvailableReceiptTypes = (state: TaxReceiptRootState) =>
  state.taxReceipt.availableTypes;
export const selectNcfTypeLocked = (state: TaxReceiptRootState) =>
  state.taxReceipt.ncfTypeLocked;
