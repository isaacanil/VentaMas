import { createSlice, type PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

import {
  defineAbilitiesFor,
  defineAbilitiesForWithDynamic,
} from '@/abilities';

// Acción asíncrona para cargar abilities con permisos dinámicos
export const loadUserAbilities = createAsyncThunk<
  any[],
  any,
  { rejectValue: string }
>(
  'abilities/loadUserAbilities',
  async (user: any, { rejectWithValue }) => {
    try {
      const abilities = await defineAbilitiesForWithDynamic(user);
      return abilities as any[];
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

interface AbilitiesState {
  abilities: any[];
  loading: boolean;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

interface AbilitiesRootState {
  abilities: AbilitiesState;
}

const initialState: AbilitiesState = {
  abilities: [],
  loading: false,
  status: 'idle',
  error: null,
};

const abilitiesSlice = createSlice({
  name: 'abilities',
  initialState,
  reducers: {
    setAbilities: (state: AbilitiesState, action: PayloadAction<any>) => {
      state.abilities = defineAbilitiesFor(action.payload);
      state.loading = false;
      state.status = 'succeeded';
      state.error = null;
    },
    clearAbilities: (state: AbilitiesState) => {
      state.abilities = [];
      state.loading = false;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserAbilities.pending, (state: AbilitiesState) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadUserAbilities.fulfilled, (state: AbilitiesState, action: PayloadAction<any[]>) => {
        state.abilities = action.payload;
        state.loading = false;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(loadUserAbilities.rejected, (state: AbilitiesState, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload as string;
      });
  },
});

export const { setAbilities, clearAbilities } = abilitiesSlice.actions;

export default abilitiesSlice.reducer;

// Memoized selectors to prevent unnecessary re-renders
const selectAbilitiesState = (state: AbilitiesRootState) => state.abilities;

export const selectAbilities = createSelector(
  [selectAbilitiesState],
  (abilitiesState: AbilitiesState) => abilitiesState.abilities
);

export const selectAbilitiesLoading = createSelector(
  [selectAbilitiesState],
  (abilitiesState: AbilitiesState) => abilitiesState.loading
);

export const selectAbilitiesStatus = createSelector(
  [selectAbilitiesState],
  (abilitiesState: AbilitiesState) => abilitiesState.status
);

export const selectAbilitiesError = createSelector(
  [selectAbilitiesState],
  (abilitiesState: AbilitiesState) => abilitiesState.error
);
