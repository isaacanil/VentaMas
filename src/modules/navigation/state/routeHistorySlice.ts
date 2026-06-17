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
}

interface NavigationRootState {
  navigation: NavigationState;
}

const initialState: NavigationState = {
  history: [],
  maxLength: 20,
};

const navigationSlice = createSlice({
  name: 'navigation',
  initialState,
  reducers: {
    pushHistory: (
      state: NavigationState,
      action: PayloadAction<LocationObject>,
    ) => {
      const newLocation = action.payload;
      const lastLocation = state.history[state.history.length - 1];
      if (
        !lastLocation ||
        newLocation.key !== lastLocation.key ||
        newLocation.pathname !== lastLocation.pathname
      ) {
        state.history.push(newLocation);
        if (state.history.length > state.maxLength) {
          state.history = state.history.slice(
            state.history.length - state.maxLength,
          );
        }
      }
    },
  },
});

export const { pushHistory } = navigationSlice.actions;

export const makeSelectPreviousRelevantRoute = (pathToIgnore?: string) => {
  return (state: NavigationRootState) => {
    const history = state.navigation.history;

    if (history.length < 2) {
      return null;
    }

    for (let i = history.length - 2; i >= 0; i--) {
      const routeToCheck = history[i];
      if (!pathToIgnore || !routeToCheck.pathname.startsWith(pathToIgnore)) {
        return routeToCheck;
      }
    }

    return null;
  };
};

export default navigationSlice.reducer;
