// src/store/navigationSlice.js
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface LocationObject {
  pathname: string;
  search: string;
  hash: string;
  state: any;
  key: string;
}

interface NavigationState {
  history: LocationObject[];
  maxLength: number;
  skipKey: string | null;
}

interface NavigationRootState {
  navigation: NavigationState;
}

const initialState: NavigationState = {
  history: [], // Array de objetos Location { pathname, search, hash, state, key }
  maxLength: 20, // Puedes configurarlo aquí o pasarlo dinámicamente
  skipKey: null, // Clave para ignorar al buscar el anterior relevante
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    // Acción para añadir una nueva ubicación al historial
    pushHistory: (
      state: NavigationState,
      action: PayloadAction<LocationObject>,
    ) => {
      const newLocation = action.payload; // Esperamos recibir el objeto Location completo
      // Evitar duplicados consecutivos (basado en key o pathname)
      const lastLocation = state.history[state.history.length - 1];
      if (
        !lastLocation ||
        newLocation.key !== lastLocation.key ||
        newLocation.pathname !== lastLocation.pathname
      ) {
        state.history.push(newLocation);
        // Limitar longitud
        if (state.history.length > state.maxLength) {
          state.history = state.history.slice(
            state.history.length - state.maxLength,
          );
        }
      }
    },
    // Podrías añadir otras acciones si necesitas (ej. setMaxLength, setSkipKey)
    setNavigationOptions: (
      state: NavigationState,
      action: PayloadAction<{ maxLength?: number; skipKey?: string | null }>,
    ) => {
      if (action.payload.maxLength !== undefined) {
        state.maxLength = action.payload.maxLength;
      }
      if (action.payload.skipKey !== undefined) {
        state.skipKey = action.payload.skipKey;
      }
    },
  },
});

export const { pushHistory, setNavigationOptions } = navigationSlice.actions;

// Selectores para acceder a los datos desde los componentes
export const selectNavigationHistory = (state: NavigationRootState) =>
  state.navigation.history;
export const selectNavigationSkipKey = (state: NavigationRootState) =>
  state.navigation.skipKey;

// Selector Factory: Creates a selector to get the previous relevant route, ignoring a specific path prefix.
export const makeSelectPreviousRelevantRoute = (pathToIgnore?: string) => {
  // Returns the actual selector function
  return (state: NavigationRootState) => {
    const history = state.navigation.history;

    if (history.length < 2) {
      return null; // Not enough history
    }

    // Iterate backwards from the second-to-last entry
    for (let i = history.length - 2; i >= 0; i--) {
      const routeToCheck = history[i];
      // Check if the route's pathname starts with the specified path to ignore
      if (!pathToIgnore || !routeToCheck.pathname.startsWith(pathToIgnore)) {
        // If it doesn't start with the ignored path (or if no path to ignore was provided),
        // this is the relevant previous route.
        return routeToCheck;
      }
    }

    return null; // No relevant previous route found
  };
};

export default navigationSlice.reducer;
