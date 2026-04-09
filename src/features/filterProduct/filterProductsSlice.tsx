import {
  createSlice,
  createAsyncThunk,
  type PayloadAction,
} from '@reduxjs/toolkit';

import {
  fetchUserFilterPreferences,
  saveUserFilterPreferences,
} from '@/firebase/Settings/filterPreferences';

export interface FilterState {
  criterio: string;
  orden: string;
  inventariable: string;
  itbis: string;
  priceStatus: string;
  costStatus: string;
  promotionStatus: string;
  stockAvailability: string;
  stockAlertLevel: string;
  stockRequirement: string;
  stockLocations: string[];
}

export const DEFAULT_FILTERS: FilterState = {
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
export const KNOWN_FILTER_CONTEXTS = [DEFAULT_FILTER_CONTEXT, 'sales'] as const;

export type FilterField = keyof FilterState;
export type FilterContext =
  | (typeof KNOWN_FILTER_CONTEXTS)[number]
  | (string & {});

interface FilterMetaState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  loadedForUser: string | null;
  hydratedContexts: Record<string, boolean>;
  dirtyContexts: Record<string, boolean>;
  lastSyncedAt: number | null;
}

interface FilterProductsState {
  contexts: Record<string, FilterState>;
  meta: FilterMetaState;
}

type FilterPayload<T> = { context?: FilterContext; value?: T } | T;
export type FilterRootState = { filterProducts: FilterProductsState };

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

const toStorageKey = (context: FilterContext, field: FilterField) => {
  const suffix = STORAGE_KEYS[field as keyof typeof STORAGE_KEYS];
  if (!suffix) return null;
  if (!context || context === DEFAULT_FILTER_CONTEXT) return suffix;
  return `${context}${capitalize(suffix)}`;
};

const serializeForStorage = (
  field: FilterField,
  value: FilterState[FilterField],
) => {
  const defaultValue = DEFAULT_FILTERS[field as keyof typeof DEFAULT_FILTERS];

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

const deserializeStoredValue = <F extends FilterField>(
  field: F,
  rawValue: string | null,
): FilterState[F] => {
  const defaultValue = DEFAULT_FILTERS[field];
  if (rawValue === null || rawValue === undefined) return defaultValue;

  if (Array.isArray(defaultValue)) {
    try {
      const parsed = JSON.parse(rawValue);
      return (Array.isArray(parsed) ? parsed : defaultValue) as FilterState[F];
    } catch {
      return defaultValue;
    }
  }

  if (typeof defaultValue === 'boolean') {
    if (rawValue === 'true') return true as unknown as FilterState[F];
    if (rawValue === 'false') return false as unknown as FilterState[F];
    return defaultValue;
  }

  if (typeof defaultValue === 'number') {
    const numeric = Number(rawValue);
    return (Number.isFinite(numeric)
      ? numeric
      : defaultValue) as unknown as FilterState[F];
  }

  return rawValue as FilterState[F];
};

const readStoredValue = (key: string | null) => {
  if (!key || typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStoredValue = (key: string | null, value: string) => {
  if (!key || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch {
    // graceful fallback when storage is unavailable
  }
};

const hydrateContextFilters = (context: FilterContext): FilterState => {
  const filters = { ...DEFAULT_FILTERS };
  (Object.keys(DEFAULT_FILTERS) as FilterField[]).forEach((field) => {
    const storageKey = toStorageKey(context, field);
    const storedValue = readStoredValue(storageKey);
    const deserializedValue = deserializeStoredValue(field, storedValue);
    Object.assign(filters, { [field]: deserializedValue });
  });
  return filters;
};

const ensureContextState = (
  state: FilterProductsState,
  context: FilterContext = DEFAULT_FILTER_CONTEXT,
) => {
  if (!state.contexts[context]) {
    state.contexts[context] = { ...DEFAULT_FILTERS };
  }
  return state.contexts[context];
};

const persistContextField = (
  context: FilterContext,
  field: FilterField,
  value: FilterState[FilterField],
) => {
  const key = toStorageKey(context, field);
  writeStoredValue(key, serializeForStorage(field, value));
};

const persistContextDefaults = (context: FilterContext) => {
  (
    Object.entries(DEFAULT_FILTERS) as [FilterField, FilterState[FilterField]][]
  ).forEach(([field, value]) => {
    persistContextField(context, field, value);
  });
};

const extractPayload = <T,>(
  payload: FilterPayload<T>,
): { context: FilterContext; value: T } => {
  if (typeof payload === 'object' && payload !== null) {
    const { context = DEFAULT_FILTER_CONTEXT } = payload as {
      context?: FilterContext;
      value?: T;
    };
    const value =
      (payload as { value?: T }).value !== undefined &&
      (payload as { value?: T }).value !== null
        ? (payload as { value?: T }).value!
        : (payload as T);
    return { context, value };
  }
  return { context: DEFAULT_FILTER_CONTEXT, value: payload as T };
};

const markContextDirty = (
  state: FilterProductsState,
  context: FilterContext,
) => {
  state.meta.dirtyContexts[context] = true;
};

const initialState: FilterProductsState = {
  contexts: KNOWN_FILTER_CONTEXTS.reduce<Record<string, FilterState>>(
    (acc, context) => {
      acc[context] = hydrateContextFilters(context);
      return acc;
    },
    {},
  ),
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

export const loadFilterPreferences = (createAsyncThunk as any)(
  'filterProducts/loadFilterPreferences',
  async (
    { userId }: { userId?: string | null },
    { rejectWithValue }: { rejectWithValue: (value: string) => unknown },
  ) => {
    if (!userId) return { contexts: null, userId: null };
    try {
      const data = await fetchUserFilterPreferences(userId);
      const contexts = (data?.contexts || data || {}) as Record<
        string,
        Partial<FilterState>
      >;
      return { contexts, userId };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'No se pudieron cargar los filtros',
      );
    }
  },
);

export const persistFilterPreferences = (createAsyncThunk as any)(
  'filterProducts/persistFilterPreferences',
  async (
    { userId, context }: { userId?: string | null; context?: FilterContext },
    {
      getState,
      rejectWithValue,
    }: {
      getState: () => FilterRootState;
      rejectWithValue: (value: string) => unknown;
    },
  ) => {
    if (!userId) return { userId: null };
    try {
      const {
        filterProducts: { contexts },
      } = getState();
      await saveUserFilterPreferences(userId, contexts);
      return { userId, context };
    } catch (error) {
      return rejectWithValue(
        error instanceof Error
          ? error.message
          : 'No se pudieron guardar los filtros',
      );
    }
  },
);

export const filterProductsSlice = createSlice({
  name: 'filterProducts',
  initialState,
  reducers: {
    setCriterio: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['criterio']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.criterio = value;
      persistContextField(context, 'criterio', value);
      markContextDirty(state, context);
    },
    setOrden: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['orden']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.orden = value;
      persistContextField(context, 'orden', value);
      markContextDirty(state, context);
    },
    setInventariable: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['inventariable']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.inventariable = value;
      persistContextField(context, 'inventariable', value);
      markContextDirty(state, context);
    },
    setItbis: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['itbis']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.itbis = value;
      persistContextField(context, 'itbis', value);
      markContextDirty(state, context);
    },
    setPriceStatus: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['priceStatus']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.priceStatus = value;
      persistContextField(context, 'priceStatus', value);
      markContextDirty(state, context);
    },
    setCostStatus: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['costStatus']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.costStatus = value;
      persistContextField(context, 'costStatus', value);
      markContextDirty(state, context);
    },
    setPromotionStatus: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['promotionStatus']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.promotionStatus = value;
      persistContextField(context, 'promotionStatus', value);
      markContextDirty(state, context);
    },
    setStockAvailability: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['stockAvailability']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.stockAvailability = value;
      persistContextField(context, 'stockAvailability', value);
      markContextDirty(state, context);
    },
    setStockAlertLevel: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['stockAlertLevel']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.stockAlertLevel = value;
      persistContextField(context, 'stockAlertLevel', value);
      markContextDirty(state, context);
    },
    setStockRequirement: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['stockRequirement']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      if (value === undefined) return;
      const contextState = ensureContextState(state, context);
      contextState.stockRequirement = value;
      persistContextField(context, 'stockRequirement', value);
      markContextDirty(state, context);
    },
    setStockLocations: (
      state: FilterProductsState,
      action: PayloadAction<FilterPayload<FilterState['stockLocations']>>,
    ) => {
      const { context, value } = extractPayload(action.payload);
      const contextState = ensureContextState(state, context);
      const normalized = Array.isArray(value) ? value.filter(Boolean) : [];
      contextState.stockLocations = normalized;
      persistContextField(context, 'stockLocations', normalized);
      markContextDirty(state, context);
    },
    resetInventoryDerivedFilters: (
      state: FilterProductsState,
      action: PayloadAction<{ context?: FilterContext } | undefined>,
    ) => {
      const context =
        action?.payload && typeof action.payload === 'object'
          ? action.payload.context
          : undefined;
      const resolvedContext = context ?? DEFAULT_FILTER_CONTEXT;
      const contextState = ensureContextState(state, resolvedContext);
      contextState.stockAvailability = DEFAULT_FILTERS.stockAvailability;
      contextState.stockAlertLevel = DEFAULT_FILTERS.stockAlertLevel;
      contextState.stockRequirement = DEFAULT_FILTERS.stockRequirement;
      contextState.stockLocations = [...DEFAULT_FILTERS.stockLocations];
      persistContextField(
        resolvedContext,
        'stockAvailability',
        contextState.stockAvailability,
      );
      persistContextField(
        resolvedContext,
        'stockAlertLevel',
        contextState.stockAlertLevel,
      );
      persistContextField(
        resolvedContext,
        'stockRequirement',
        contextState.stockRequirement,
      );
      persistContextField(
        resolvedContext,
        'stockLocations',
        contextState.stockLocations,
      );
      markContextDirty(state, resolvedContext);
    },
    resetFilters: (
      state: FilterProductsState,
      action: PayloadAction<{ context?: FilterContext } | undefined>,
    ) => {
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
      .addCase(
        loadFilterPreferences.pending,
        (state: FilterProductsState, action) => {
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
        },
      )
      .addCase(
        loadFilterPreferences.fulfilled,
        (state: FilterProductsState, action) => {
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
              (
                Object.entries(state.contexts[context]) as [
                  FilterField,
                  FilterState[FilterField],
                ][]
              ).forEach(([field, value]) =>
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
        },
      )
      .addCase(
        loadFilterPreferences.rejected,
        (state: FilterProductsState, action) => {
          state.meta.loading = false;
          const attemptedUser = action?.meta?.arg?.userId;
          if (attemptedUser) {
            state.meta.loadedForUser = attemptedUser;
          }
          state.meta.error = action.payload || action.error?.message || null;
        },
      )
      .addCase(
        persistFilterPreferences.pending,
        (state: FilterProductsState) => {
          state.meta.saving = true;
          state.meta.error = null;
        },
      )
      .addCase(
        persistFilterPreferences.fulfilled,
        (state: FilterProductsState, action) => {
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
        },
      )
      .addCase(
        persistFilterPreferences.rejected,
        (state: FilterProductsState, action) => {
          state.meta.saving = false;
          state.meta.error = action.payload || action.error?.message || null;
        },
      );
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
  resetInventoryDerivedFilters,
  resetFilters,
} = filterProductsSlice.actions;

export default filterProductsSlice.reducer;

const selectContextFilters = (
  state: FilterRootState,
  context: FilterContext = DEFAULT_FILTER_CONTEXT,
) => state.filterProducts.contexts?.[context] ?? DEFAULT_FILTERS;

export const selectFiltersByContext = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context);
export const selectCriterio = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).criterio;
export const selectOrden = (state: FilterRootState, context?: FilterContext) =>
  selectContextFilters(state, context).orden;
export const selectInventariable = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).inventariable;
export const selectItbis = (state: FilterRootState, context?: FilterContext) =>
  selectContextFilters(state, context).itbis;
export const selectPriceStatus = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).priceStatus;
export const selectCostStatus = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).costStatus;
export const selectPromotionStatus = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).promotionStatus;
export const selectStockAvailability = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).stockAvailability;
export const selectStockAlertLevel = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).stockAlertLevel;
export const selectStockRequirement = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).stockRequirement;
export const selectStockLocations = (
  state: FilterRootState,
  context?: FilterContext,
) => selectContextFilters(state, context).stockLocations;

export const selectFilterMeta = (state: FilterRootState) =>
  state.filterProducts.meta;
