import { createSlice, type PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

import { fbAddDoctor } from '@/firebase/doctors/fbAddDoctor';
import { fbCheckDoctorExists } from '@/firebase/doctors/fbCheckDoctorExists';
import { fbDeleteDoctor } from '@/firebase/doctors/fbDeleteDoctor';
import { fbUpdateDoctor } from '@/firebase/doctors/fbUpdateDoctor';
import type { DoctorRecord } from '@/types/doctors';
import type { UserIdentity } from '@/types/users';

type DoctorModalMode = 'add' | 'edit';

interface DoctorsState {
  doctors: DoctorRecord[];
  selectedDoctor: DoctorRecord | null;
  modal: {
    open: boolean;
    mode: DoctorModalMode;
    loading: boolean;
  };
  loading: boolean;
  error: string | null;
}

type DoctorThunkArgs = { doctor: DoctorRecord; user: UserIdentity };
type DeleteDoctorArgs = { doctorId: string; user: UserIdentity };

type DoctorsRootState = { doctors: DoctorsState };

// Async thunks
export const addDoctor = createAsyncThunk<
  DoctorRecord,
  DoctorThunkArgs,
  { rejectValue: string }
>(
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
      const err = error as Error;
      return rejectWithValue(err.message || 'Error al agregar mÃ©dico');
    }
  },
);

export const updateDoctor = createAsyncThunk<
  DoctorRecord,
  DoctorThunkArgs,
  { rejectValue: string }
>(
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
      const err = error as Error;
      return rejectWithValue(err.message || 'Error al actualizar mÃ©dico');
    }
  },
);

export const deleteDoctor = createAsyncThunk<
  string,
  DeleteDoctorArgs,
  { rejectValue: string }
>(
  'doctors/delete',
  async ({ doctorId, user }, { rejectWithValue }) => {
    try {
      await fbDeleteDoctor(doctorId, user);
      return doctorId;
    } catch (error) {
      const err = error as Error;
      return rejectWithValue(err.message || 'Error al eliminar mÃ©dico');
    }
  },
);

const initialState: DoctorsState = {
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
    clearError: (state: DoctorsState) => {
      state.error = null;
    },
    setSelectedDoctor: (
      state: DoctorsState,
      action: PayloadAction<DoctorRecord | null>,
    ) => {
      state.selectedDoctor = action.payload;
    },
    clearSelectedDoctor: (state: DoctorsState) => {
      state.selectedDoctor = null;
    },
    openModal: (
      state: DoctorsState,
      action: PayloadAction<
        | {
            mode?: DoctorModalMode;
            doctor?: DoctorRecord;
          }
        | undefined
      >,
    ) => {
      state.modal.open = true;
      state.modal.mode = action.payload?.mode || 'add';
      if (action.payload?.doctor) {
        state.selectedDoctor = action.payload.doctor;
      }
    },
    closeModal: (state: DoctorsState) => {
      state.modal.open = false;
      state.modal.mode = 'add';
      state.selectedDoctor = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add doctor
      .addCase(addDoctor.pending, (state) => {
        state.modal.loading = true;
        state.error = null;
      })
      .addCase(addDoctor.fulfilled, (state) => {
        state.modal.loading = false;
        state.modal.open = false;
        state.selectedDoctor = null;
        // Note: The doctor will be added to the list via the real-time listener
      })
      .addCase(addDoctor.rejected, (state, action) => {
        state.modal.loading = false;
        state.error = action.payload ?? null;
      })
      // Update doctor
      .addCase(updateDoctor.pending, (state) => {
        state.modal.loading = true;
        state.error = null;
      })
      .addCase(updateDoctor.fulfilled, (state) => {
        state.modal.loading = false;
        state.modal.open = false;
        state.selectedDoctor = null;
        // Note: The doctor will be updated in the list via the real-time listener
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.modal.loading = false;
        state.error = action.payload ?? null;
      })
      // Delete doctor
      .addCase(deleteDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDoctor.fulfilled, (state) => {
        state.loading = false;
        // Note: The doctor will be removed from the list via the real-time listener
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? null;
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
export const selectDoctors = (state: DoctorsRootState) =>
  state.doctors.doctors;
export const selectSelectedDoctor = (state: DoctorsRootState) =>
  state.doctors.selectedDoctor;
export const selectDoctorsModal = (state: DoctorsRootState) =>
  state.doctors.modal;
export const selectDoctorsLoading = (state: DoctorsRootState) =>
  state.doctors.loading;
export const selectDoctorsError = (state: DoctorsRootState) =>
  state.doctors.error;

export default doctorsSlice.reducer;


