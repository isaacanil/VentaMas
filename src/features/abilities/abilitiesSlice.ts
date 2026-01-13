import { createSlice, type PayloadAction, createAsyncThunk, createSelector } from '@reduxjs/toolkit';

import {
  defineAbilitiesFor,
  defineAbilitiesForWithDynamic,
} from '@/abilities';

// AcciÃ³n asÃ­ncrona para cargar abilities con permisos dinÃ¡micos
export const loadUserAbilities = (createAsyncThunk as any)(
  'abilities/loadUserAbilities',
  async (user, { rejectWithValue }) => {
    try {
      const abilities = await defineAbilitiesForWithDynamic(user);
      return abilities;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const initialState = {
  abilities: [],
  loading: false,
  status: 'idle',
  error: null,
};

const abilitiesSlice = createSlice({
  name: 'abilities',
  initialState,
  reducers: {
    setAbilities: (state: any, action: PayloadAction<any>) => {
      state.abilities = defineAbilitiesFor(action.payload);
      state.loading = false;
      state.status = 'succeeded';
      state.error = null;
    },
    clearAbilities: (state: any) => {
      state.abilities = [];
      state.loading = false;
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder: any) => {
    builder
      .addCase(loadUserAbilities.pending, (state) => {
        state.loading = true;
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loadUserAbilities.fulfilled, (state, action) => {
        state.abilities = action.payload;
        state.loading = false;
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(loadUserAbilities.rejected, (state, action) => {
        state.loading = false;
        state.status = 'failed';
        state.error = action.payload;
        // Mantener abilities existentes en caso de error
      });
  },
});

export const { setAbilities, clearAbilities } = abilitiesSlice.actions;

export default abilitiesSlice.reducer;

// Memoized selectors to prevent unnecessary re-renders
const selectAbilitiesState = (state) => state.abilities;

export const selectAbilities = createSelector(
  [selectAbilitiesState],
  (abilitiesState) => abilitiesState.abilities
);

export const selectAbilitiesLoading = createSelector(
  [selectAbilitiesState],
  (abilitiesState) => abilitiesState.loading
);

export const selectAbilitiesStatus = createSelector(
  [selectAbilitiesState],
  (abilitiesState) => abilitiesState.status
);

export const selectAbilitiesError = createSelector(
  [selectAbilitiesState],
  (abilitiesState) => abilitiesState.error
);


