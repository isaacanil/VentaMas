import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const userRegistrationSlice = createSlice({
  name: 'userRegistration',
  initialState: {
    user: {
      name: '',
      password: '',
      role: '',
      id: '',
      businessID: undefined,
      createAt: '',
    },
    errors: {},
    status: 'idle',
    errorMessage: '',
  },
  reducers: {
    updateUser: (state: any, action: PayloadAction<any>) => {
      state.user = { ...state.user, ...action.payload };
    },
    setManagementUser: (state: any, action: PayloadAction<any>) => {
      state.user = { ...action.payload };
    },
    setErrors: (state: any, action: PayloadAction<any>) => {
      state.errors = action.payload;
    },
    clear: (state: any) => {
      state.user = {
        name: '',
        password: '',
        role: '',
        id: '',
        businessID: undefined,
        createAt: '',
      };
      state.errors = {};
    },
  },
});

export const { updateUser, setErrors, clear } = userRegistrationSlice.actions;
export default userRegistrationSlice.reducer;

export const selectUserManager = (state) => state.usersManagement;
