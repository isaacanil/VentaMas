import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const userRegistrationSlice = createSlice({
  name: 'userRegistration',
  initialState: {
    user: {
      name: '',
      password: '',
      role: '',
      id: '',
      businessID: undefined,
      createAt: "",
    },
    errors: {},
    status: 'idle',
    errorMessage: '',
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
    },
    setManagementUser: (state, action) => {
      state.user = { ...action.payload };
    },
    setErrors: (state, action) => {
      state.errors = action.payload;
    },
    clear: (state) => {
      state.user = {
        name: '',
        password: '',
        role: '',
        id: '',
        businessID: undefined,
        createAt: "",
      };
      state.errors = {};
    },
  },
 
});

export const { updateUser, setErrors, clear } = userRegistrationSlice.actions;
export default userRegistrationSlice.reducer;

export const selectUserManager = (state) => state.usersManagement;