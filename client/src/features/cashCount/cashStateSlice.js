import { createSlice } from '@reduxjs/toolkit';

const cashStateSlice = createSlice({
  name: 'cashState',
  initialState: {
    estado: 'closed',
    cuadreId: null,
    // Puedes agregar aquí cualquier otra información que necesites
  },
  reducers: {
    setCashState: (state, action) => {
      state.estado = action.payload.estado;
      state.cuadreId = action.payload.cuadreId;
      // No olvides actualizar aquí cualquier otra información que hayas agregado
    },
  },
});

export const { setCashState } = cashStateSlice.actions;

export default cashStateSlice.reducer;
