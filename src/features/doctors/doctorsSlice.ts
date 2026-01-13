import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

import { fbAddDoctor } from '@/firebase/doctors/fbAddDoctor';
import { fbCheckDoctorExists } from '@/firebase/doctors/fbCheckDoctorExists';
import { fbDeleteDoctor } from '@/firebase/doctors/fbDeleteDoctor';
import { fbUpdateDoctor } from '@/firebase/doctors/fbUpdateDoctor';

// Async thunks
export const addDoctor = createAsyncThunk<any, { doctor: any; user: any }>(
  'doctors/add',
  async ({ doctor, user }, { rejectWithValue }) => {
    try {
      // Check if doctor already exists
      const duplicates = await fbCheckDoctorExists(
        user.businessID,
        doctor.name,
        doctor.specialty,
      );

      if (duplicates.exists) {
        return rejectWithValue(duplicates.message);
      }

      const doctorId = await fbAddDoctor(doctor, user);
      return { ...doctor, id: doctorId };
    } catch (error) {
      return rejectWithValue(error.message || 'Error al agregar mÃ©dico');
    }
  },
);

export const updateDoctor = createAsyncThunk<any, { doctor: any; user: any }>(
  'doctors/update',
  async ({ doctor, user }, { rejectWithValue }) => {
    try {
      // Check if doctor already exists (excluding current doctor)
      const duplicates = await fbCheckDoctorExists(
        user.businessID,
        doctor.name,
        doctor.specialty,
        doctor.id,
      );

      if (duplicates.exists) {
        return rejectWithValue(duplicates.message);
      }

      await fbUpdateDoctor(doctor, user);
      return doctor;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al actualizar mÃ©dico');
    }
  },
);

export const deleteDoctor = createAsyncThunk<any, { doctorId: any; user: any }>(
  'doctors/delete',
  async ({ doctorId, user }, { rejectWithValue }) => {
    try {
      await fbDeleteDoctor(doctorId, user);
      return doctorId;
    } catch (error) {
      return rejectWithValue(error.message || 'Error al eliminar mÃ©dico');
    }
  },
);

const initialState = {
  doctors: [],
  selectedDoctor: null,
  modal: {
    open: false,
    mode: 'add', // 'add' or 'edit'
    loading: false,
  },
  loading: false,
  error: null,
};

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    clearError: (state: any) => {
      state.error = null;
    },
    setSelectedDoctor: (state: any, action: PayloadAction<any>) => {
      state.selectedDoctor = action.payload;
    },
    clearSelectedDoctor: (state: any) => {
      state.selectedDoctor = null;
    },
    openModal: (state: any, action: PayloadAction<any>) => {
      state.modal.open = true;
      state.modal.mode = action.payload?.mode || 'add';
      if (action.payload?.doctor) {
        state.selectedDoctor = action.payload.doctor;
      }
    },
    closeModal: (state: any) => {
      state.modal.open = false;
      state.modal.mode = 'add';
      state.selectedDoctor = null;
      state.error = null;
    },
  },
  extraReducers: (builder: any) => {
    builder
      // Add doctor
      .addCase(addDoctor.pending, (state) => {
        state.modal.loading = true;
        state.error = null;
      })
      .addCase(addDoctor.fulfilled, (state, _action) => {
        state.modal.loading = false;
        state.modal.open = false;
        state.selectedDoctor = null;
        // Note: The doctor will be added to the list via the real-time listener
      })
      .addCase(addDoctor.rejected, (state, action) => {
        state.modal.loading = false;
        state.error = action.payload;
      })
      // Update doctor
      .addCase(updateDoctor.pending, (state) => {
        state.modal.loading = true;
        state.error = null;
      })
      .addCase(updateDoctor.fulfilled, (state, _action) => {
        state.modal.loading = false;
        state.modal.open = false;
        state.selectedDoctor = null;
        // Note: The doctor will be updated in the list via the real-time listener
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.modal.loading = false;
        state.error = action.payload;
      })
      // Delete doctor
      .addCase(deleteDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDoctor.fulfilled, (state, _action) => {
        state.loading = false;
        // Note: The doctor will be removed from the list via the real-time listener
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setSelectedDoctor,
  clearSelectedDoctor,
  openModal,
  closeModal,
} = doctorsSlice.actions;

// Selectors
export const selectDoctors = (state) => state.doctors.doctors;
export const selectSelectedDoctor = (state) => state.doctors.selectedDoctor;
export const selectDoctorsModal = (state) => state.doctors.modal;
export const selectDoctorsLoading = (state) => state.doctors.loading;
export const selectDoctorsError = (state) => state.doctors.error;

export default doctorsSlice.reducer;


