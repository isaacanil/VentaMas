import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  originalBusinessId: null, // Para guardar el businessID original como referencia
  originalRole: null, // Para guardar el role original como referencia
};

export const userSlice = (createSlice as any)({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.user = { ...(state.user || {}), ...action.payload };
    },
    addUserData: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state) => {
      state.user = null;
      state.originalBusinessId = null; // Limpiar también la referencia original
      state.originalRole = null; // Limpiar también el role original
    },
    // Cambiar temporalmente de negocio (modo invitado)
    switchToBusiness: (state, action) => {
      if (state.user) {
        // Guardar el businessID original si no está guardado
        if (!state.originalBusinessId) {
          state.originalBusinessId = state.user.businessID;
        }
        // Cambiar el businessID actual
        state.user.businessID = action.payload;
      }
    }, // Volver al negocio original
    returnToOriginalBusiness: (state) => {
      if (state.user && state.originalBusinessId) {
        state.user.businessID = state.originalBusinessId;
        state.originalBusinessId = null;
      }
    },
    // Cambiar temporalmente de role (modo desarrollador)
    switchToRole: (state, action) => {
      if (state.user) {
        // Guardar el role original si no está guardado
        if (!state.originalRole) {
          state.originalRole = state.user.role;
        }
        // Cambiar el role actual
        state.user.role = action.payload;
      }
    },
    // Volver al role original
    returnToOriginalRole: (state) => {
      if (state.user && state.originalRole) {
        state.user.role = state.originalRole;
        state.originalRole = null;
      }
    },
  },
});

export const {
  login,
  logout,
  addUserData,
  switchToBusiness,
  returnToOriginalBusiness,
  switchToRole,
  returnToOriginalRole,
} = userSlice.actions;

export const selectUser = (state) => state.user.user;

// Selector para saber si estamos en modo temporal
export const selectIsTemporaryMode = (state) => !!state.user.originalBusinessId;

// Selector para obtener el businessID original del usuario
export const selectOriginalBusinessId = (state) =>
  state.user.originalBusinessId;

// Selector para saber si estamos en modo temporal de role
export const selectIsTemporaryRoleMode = (state) => !!state.user.originalRole;

// Selector para obtener el role original del usuario
export const selectOriginalRole = (state) => state.user.originalRole;

export default userSlice.reducer;

