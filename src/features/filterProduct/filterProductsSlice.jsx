import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { fetchUserFilterPreferences, saveUserFilterPreferences } from '../../firebase/settings/filterPreferences';

export const DEFAULT_FILTERS = {
  criterio: 'nombre',
  orden: 'asc',
  inventariable: 'todos',
  itbis: 'todos',
  priceStatus: 'todos',
  costStatus: 'todos',
  promotionStatus: 'todos',
  stockAvailability: 'todos',
  stockAlertLevel: 'todos',
  stockRequirement: 'todos',
  stockLocations: [],
};

export const DEFAULT_FILTER_CONTEXT = 'inventory';
export const KNOWN_FILTER_CONTEXTS = [DEFAULT_FILTER_CONTEXT, 'sales'];

const STORAGE_KEYS = {
  criterio: 'filterCriterio',
  orden: 'filterOrden',
  inventariable: 'filterInventariable',
  itbis: 'filterItbis',
  priceStatus: 'filterPriceStatus',
  costStatus: 'filterCostStatus',
  promotionStatus: 'filterPromotionStatus',
  stockAvailability: 'filterStockAvailability',
  stockAlertLevel: 'filterStockAlertLevel',
  stockRequirement: 'filterStockRequirement',
  stockLocations: 'filterStockLocations',
};

const capitalize = (value = '') =>
  value.charAt(0).toUpperCase() + value.slice(1);

const toStorageKey = (context, field) => {
  const suffix = STORAGE_KEYS[field];
  if (!suffix) return null;
  if (!context || context === DEFAULT_FILTER_CONTEXT) return suffix;
  return `${context}${capitalize(suffix)}`;
};

const serializeForStorage = (field, value) => {
  const defaultValue = DEFAULT_FILTERS[field];

  if (Array.isArray(defaultValue)) {
    const arrayValue = Array.isArray(value) ? value : defaultValue;
    try {
      return JSON.stringify(arrayValue);
    } catch {
      return JSON.stringify(defaultValue);
    }
  }

  if (value === undefined || value === null) {
    return defaultValue !== undefined && defaultValue !== null
      ? String(defaultValue)
      : '';
  }

  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '';
    }
  }

  return String(value);
};

const deserializeStoredValue = (field, rawValue) => {
  const defaultValue = DEFAULT_FILTERS[field];
  if (rawValue === null || rawValue === undefined) return defaultValue;

  if (Array.isArray(defaultValue)) {
    try {
      const parsed = JSON.parse(rawValue);
      return Array.isArray(parsed) ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  if (typeof defaultValue === 'boolean') {
    if (rawValue === 'true') return true;
    if (rawValue === 'false') return false;
    return defaultValue;
  }

  if (typeof defaultValue === 'number') {
    const numeric = Number(rawValue);
    return Number.isFinite(numeric) ? numeric : defaultValue;
  }

  return rawValue;
};

const readStoredValue = (key) => {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStoredValue = (key, value) => {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // graceful fallback when storage is unavailable
  }
};

const hydrateContextFilters = (context) => {
  const filters = {};
  Object.keys(DEFAULT_FILTERS).forEach((field) => {
    const storageKey = toStorageKey(context, field);
    const storedValue = readStoredValue(storageKey);
    filters[field] = deserializeStoredValue(field, storedValue);
  });
  return filters;
};

const ensureContextState = (state, context = DEFAULT_FILTER_CONTEXT) => {
  if (!state.contexts[context]) {
    state.contexts[context] = { ...DEFAULT_FILTERS };
  }
  return state.contexts[context];
};

const persistContextField = (context, field, value) => {
  const key = toStorageKey(context, field);
  writeStoredValue(key, serializeForStorage(field, value));
};

const persistContextDefaults = (context) => {
  Object.entries(DEFAULT_FILTERS).forEach(([field, value]) => {
    persistContextField(context, field, value);
  });
};

const extractPayload = (payload) => {
  if (typeof payload === 'object' && payload !== null) {
    const { context = DEFAULT_FILTER_CONTEXT } = payload;
    const value =
      payload.value !== undefined && payload.value !== null
        ? payload.value
        : payload;
    return { context, value };
  }
  return { context: DEFAULT_FILTER_CONTEXT, value: payload };
};

const markContextDirty = (state, context) => {
  state.meta.dirtyContexts[context] = true;
};

const initialState = {
  contexts: KNOWN_FILTER_CONTEXTS.reduce((acc, context) => {
    acc[context] = hydrateContextFilters(context);
    return acc;
  }, {}),
  meta: {
    loading: false,
    saving: false,
    error: null,
    loadedForUser: null,
    hydratedContexts: {},
    dirtyContexts: {},
    lastSyncedAt: null,
  },
};

export const loadFilterPreferences = createAsyncThunk(
  'filterProducts/loadFilterPreferences',
  async ({ userId }, { rejectWithValue }) => {
    if (!userId) return { contexts: null, userId: null };
    try {
      const data = await fetchUserFilterPreferences(userId);
      const contexts = data?.contexts || data || {};
      return { contexts, userId };
    } catch (error) {
      return rejectWithValue(error?.message || 'No se pudieron cargar los filtros');
    }
  },
);

export const persistFilterPreferences = createAsyncThunk(
  'filterProducts/persistFilterPreferences',
  async ({ userId, context }, { getState, rejectWithValue }) => {
    if (!userId) return { userId: null };
    try {
      const {
        filterProducts: { contexts },
      } = getState();
      await saveUserFilterPreferences(userId, contexts);
      return { userId, context };
    } catch (error) {
      return rejectWithValue(error?.message || 'No se pudieron guardar los filtros');
    }
  },
);

export const filterProductsSlice = createSlice({
  name: 'filterProducts',
  initialState,
  reducers: {
    setCriterio: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.criterio = value;
      persistContextField(context, 'criterio', value);
      markContextDirty(state, context);
    },
    setOrden: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.orden = value;
      persistContextField(context, 'orden', value);
      markContextDirty(state, context);
    },
    setInventariable: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.inventariable = value;
      persistContextField(context, 'inventariable', value);
      markContextDirty(state, context);
    },
    setItbis: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.itbis = value;
      persistContextField(context, 'itbis', value);
      markContextDirty(state, context);
    },
    setPriceStatus: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.priceStatus = value;
      persistContextField(context, 'priceStatus', value);
      markContextDirty(state, context);
    },
    setCostStatus: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.costStatus = value;
      persistContextField(context, 'costStatus', value);
      markContextDirty(state, context);
    },
    setPromotionStatus: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.promotionStatus = value;
      persistContextField(context, 'promotionStatus', value);
      markContextDirty(state, context);
    },
    setStockAvailability: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.stockAvailability = value;
      persistContextField(context, 'stockAvailability', value);
      markContextDirty(state, context);
    },
    setStockAlertLevel: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.stockAlertLevel = value;
      persistContextField(context, 'stockAlertLevel', value);
      markContextDirty(state, context);
    },
    setStockRequirement: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.stockRequirement = value;
      persistContextField(context, 'stockRequirement', value);
      markContextDirty(state, context);
    },
    setStockLocations: (state, action) => {
      const { context, value } = extractPayload(action.payload);
      const contextState = ensureContextState(state, context);
      const normalized = Array.isArray(value) ? value.filter(Boolean) : [];
      contextState.stockLocations = normalized;
      persistContextField(context, 'stockLocations', normalized);
      markContextDirty(state, context);
    },
    resetFilters: (state, action) => {
      const context =
        action?.payload && typeof action.payload === 'object'
          ? action.payload.context
          : undefined;
      if (context) {
        state.contexts[context] = { ...DEFAULT_FILTERS };
        persistContextDefaults(context);
        markContextDirty(state, context);
        return;
      }
      Object.keys(state.contexts).forEach((ctx) => {
        state.contexts[ctx] = { ...DEFAULT_FILTERS };
        persistContextDefaults(ctx);
        markContextDirty(state, ctx);
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFilterPreferences.pending, (state, action) => {
        state.meta.loading = true;
        state.meta.error = null;
        const incomingUserId = action?.meta?.arg?.userId;
        if (
          incomingUserId &&
          state.meta.loadedForUser &&
          state.meta.loadedForUser !== incomingUserId
        ) {
          KNOWN_FILTER_CONTEXTS.forEach((context) => {
            state.contexts[context] = { ...DEFAULT_FILTERS };
            persistContextDefaults(context);
            state.meta.hydratedContexts[context] = false;
            state.meta.dirtyContexts[context] = false;
          });
        }
      })
      .addCase(loadFilterPreferences.fulfilled, (state, action) => {
        state.meta.loading = false;
        state.meta.error = null;
        const { contexts, userId } = action.payload || {};
        if (userId) {
          state.meta.loadedForUser = userId;
        }
        KNOWN_FILTER_CONTEXTS.forEach((context) => {
          const remote = contexts?.[context];
          if (remote && typeof remote === 'object') {
            state.contexts[context] = {
              ...DEFAULT_FILTERS,
              ...remote,
            };
            Object.entries(state.contexts[context]).forEach(([field, value]) =>
              persistContextField(context, field, value),
            );
          } else {
            state.contexts[context] = {
              ...DEFAULT_FILTERS,
              ...state.contexts[context],
            };
          }
          state.meta.hydratedContexts[context] = true;
          state.meta.dirtyContexts[context] = false;
        });
      })
      .addCase(loadFilterPreferences.rejected, (state, action) => {
        state.meta.loading = false;
        const attemptedUser = action?.meta?.arg?.userId;
        if (attemptedUser) {
          state.meta.loadedForUser = attemptedUser;
        }
        state.meta.error = action.payload || action.error?.message || null;
      })
      .addCase(persistFilterPreferences.pending, (state) => {
        state.meta.saving = true;
        state.meta.error = null;
      })
      .addCase(persistFilterPreferences.fulfilled, (state, action) => {
        state.meta.saving = false;
        state.meta.error = null;
        const { context } = action.payload || {};
        state.meta.lastSyncedAt = Date.now();
        if (context) {
          state.meta.dirtyContexts[context] = false;
        } else {
          Object.keys(state.contexts).forEach((ctx) => {
            state.meta.dirtyContexts[ctx] = false;
          });
        }
      })
      .addCase(persistFilterPreferences.rejected, (state, action) => {
        state.meta.saving = false;
        state.meta.error = action.payload || action.error?.message || null;
      });
  },
});

export const {
  setCriterio,
  setOrden,
  setInventariable,
  setItbis,
  setPriceStatus,
  setCostStatus,
  setPromotionStatus,
  setStockAvailability,
  setStockAlertLevel,
  setStockRequirement,
  setStockLocations,
  resetFilters,
} = filterProductsSlice.actions;

export default filterProductsSlice.reducer;

const selectContextFilters = (
  state,
  context = DEFAULT_FILTER_CONTEXT,
) => state.filterProducts.contexts?.[context] ?? DEFAULT_FILTERS;

export const selectFiltersByContext = (state, context) =>
  selectContextFilters(state, context);
export const selectCriterio = (state, context) =>
  selectContextFilters(state, context).criterio;
export const selectOrden = (state, context) =>
  selectContextFilters(state, context).orden;
export const selectInventariable = (state, context) =>
  selectContextFilters(state, context).inventariable;
export const selectItbis = (state, context) =>
  selectContextFilters(state, context).itbis;
export const selectPriceStatus = (state, context) =>
  selectContextFilters(state, context).priceStatus;
export const selectCostStatus = (state, context) =>
  selectContextFilters(state, context).costStatus;
export const selectPromotionStatus = (state, context) =>
  selectContextFilters(state, context).promotionStatus;
export const selectStockAvailability = (state, context) =>
  selectContextFilters(state, context).stockAvailability;
export const selectStockAlertLevel = (state, context) =>
  selectContextFilters(state, context).stockAlertLevel;
export const selectStockRequirement = (state, context) =>
  selectContextFilters(state, context).stockRequirement;
export const selectStockLocations = (state, context) =>
  selectContextFilters(state, context).stockLocations;

export const selectFilterMeta = (state) => state.filterProducts.meta;
