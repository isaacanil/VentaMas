import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: string;
  name: string;
  businessID: string;
  role: string;
  [key: string]: any;
}

interface UserState {
  user: User | null;
  originalBusinessId: string | null;
  originalRole: string | null;
}

interface UserRootState {
  user: UserState;
}

const initialState: UserState = {
  user: null,
  originalBusinessId: null, // Para guardar el businessID original como referencia
  originalRole: null, // Para guardar el role original como referencia
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state: UserState, action: PayloadAction<Partial<User>>) => {
      state.user = { ...(state.user || {}), ...action.payload } as User;
    },
    addUserData: (state: UserState, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    logout: (state: UserState) => {
      state.user = null;
      state.originalBusinessId = null; // Limpiar también la referencia original
      state.originalRole = null; // Limpiar también el role original
    },
    // Cambiar temporalmente de negocio (modo invitado)
    switchToBusiness: (state: UserState, action: PayloadAction<string>) => {
      if (state.user) {
        // Guardar el businessID original si no está guardado
        if (!state.originalBusinessId) {
          state.originalBusinessId = state.user.businessID;
        }
        // Cambiar el businessID actual
        state.user.businessID = action.payload;
      }
    }, // Volver al negocio original
    returnToOriginalBusiness: (state: UserState) => {
      if (state.user && state.originalBusinessId) {
        state.user.businessID = state.originalBusinessId;
        state.originalBusinessId = null;
      }
    },
    // Cambiar temporalmente de role (modo desarrollador)
    switchToRole: (state: UserState, action: PayloadAction<string>) => {
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
    returnToOriginalRole: (state: UserState) => {
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

export const selectUser = (state: UserRootState) => state.user.user;

// Selector para saber si estamos en modo temporal
export const selectIsTemporaryMode = (state: UserRootState) => !!state.user.originalBusinessId;

// Selector para obtener el businessID original del usuario
export const selectOriginalBusinessId = (state: UserRootState) =>
  state.user.originalBusinessId;

// Selector para saber si estamos en modo temporal de role
export const selectIsTemporaryRoleMode = (state: UserRootState) => !!state.user.originalRole;

// Selector para obtener el role original del usuario
export const selectOriginalRole = (state: UserRootState) => state.user.originalRole;

export default userSlice.reducer;
