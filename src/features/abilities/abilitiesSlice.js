import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import {
  defineAbilitiesFor,
  defineAbilitiesForWithDynamic,
} from '../../abilities';

// Acción asíncrona para cargar abilities con permisos dinámicos
export const loadUserAbilities = createAsyncThunk(
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
  error: null,
};

const abilitiesSlice = createSlice({
  name: 'abilities',
  initialState,
  reducers: {
    setAbilities: (state, action) => {
      state.abilities = defineAbilitiesFor(action.payload);
      state.loading = false;
      state.error = null;
    },
    clearAbilities: (state) => {
      state.abilities = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadUserAbilities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserAbilities.fulfilled, (state, action) => {
        state.abilities = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(loadUserAbilities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        // Mantener abilities existentes en caso de error
      });
  },
});

export const { setAbilities, clearAbilities } = abilitiesSlice.actions;

export default abilitiesSlice.reducer;

export const selectAbilities = (state) => state.abilities.abilities;
export const selectAbilitiesLoading = (state) => state.abilities.loading;
export const selectAbilitiesError = (state) => state.abilities.error;
