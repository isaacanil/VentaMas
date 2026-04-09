import {
  createSlice,
  type PayloadAction,
  createAsyncThunk,
} from '@reduxjs/toolkit';

import { fbAddDoctor } from '@/firebase/doctors/fbAddDoctor';
import { fbCheckDoctorExists } from '@/firebase/doctors/fbCheckDoctorExists';
import { fbDeleteDoctor } from '@/firebase/doctors/fbDeleteDoctor';
import { fbUpdateDoctor } from '@/firebase/doctors/fbUpdateDoctor';
import type { DoctorRecord } from '@/types/doctors';
import type { UserIdentity, UserWithBusiness } from '@/types/users';

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
>('doctors/add', async ({ doctor, user }, { rejectWithValue }) => {
  try {
    if (!user.businessID) {
      return rejectWithValue('Falta businessID del usuario');
    }
    const userWithBusiness: UserWithBusiness = {
      ...user,
      businessID: user.businessID,
    };
    // Check if doctor already exists
    const duplicates = await fbCheckDoctorExists(
      userWithBusiness.businessID,
      doctor.name,
      doctor.specialty,
    );

    if (duplicates.exists) {
      return rejectWithValue(duplicates.message || 'El médico ya existe');
    }

    const doctorId = await fbAddDoctor(doctor, userWithBusiness);
    return { ...doctor, id: doctorId };
  } catch (error) {
    const err = error as Error;
    return rejectWithValue(err.message || 'Error al agregar médico');
  }
});

export const updateDoctor = createAsyncThunk<
  DoctorRecord,
  DoctorThunkArgs,
  { rejectValue: string }
>('doctors/update', async ({ doctor, user }, { rejectWithValue }) => {
  try {
    if (!user.businessID) {
      return rejectWithValue('Falta businessID del usuario');
    }
    const userWithBusiness: UserWithBusiness = {
      ...user,
      businessID: user.businessID,
    };
    // Check if doctor already exists (excluding current doctor)
    const duplicates = await fbCheckDoctorExists(
      userWithBusiness.businessID,
      doctor.name,
      doctor.specialty,
      doctor.id,
    );

    if (duplicates.exists) {
      return rejectWithValue(duplicates.message || 'El médico ya existe');
    }

    await fbUpdateDoctor(doctor, userWithBusiness);
    return doctor;
  } catch (error) {
    const err = error as Error;
    return rejectWithValue(err.message || 'Error al actualizar médico');
  }
});

export const deleteDoctor = createAsyncThunk<
  string,
  DeleteDoctorArgs,
  { rejectValue: string }
>('doctors/delete', async ({ doctorId, user }, { rejectWithValue }) => {
  try {
    if (!user.businessID) {
      return rejectWithValue('Falta businessID del usuario');
    }
    const userWithBusiness: UserWithBusiness = {
      ...user,
      businessID: user.businessID,
    };
    await fbDeleteDoctor(doctorId, userWithBusiness);
    return doctorId;
  } catch (error) {
    const err = error as Error;
    return rejectWithValue(err.message || 'Error al eliminar médico');
  }
});

const initialState: DoctorsState = {
  doctors: [],
  selectedDoctor: null,
  modal: {
    open: false,
    mode: 'add',
    loading: false,
  },
  loading: false,
  error: null,
};

const doctorsSlice = createSlice({
  name: 'doctors',
  initialState,
  reducers: {
    setDoctors: (
      state: DoctorsState,
      action: PayloadAction<DoctorRecord[]>,
    ) => {
      state.doctors = action.payload;
    },
    openModal: (
      state: DoctorsState,
      action: PayloadAction<{
        mode: DoctorModalMode;
        doctor?: DoctorRecord | null;
      }>,
    ) => {
      state.modal.open = true;
      state.modal.mode = action.payload.mode;
      state.selectedDoctor = action.payload.doctor || null;
      state.error = null;
    },
    closeModal: (state: DoctorsState) => {
      state.modal.open = false;
      state.selectedDoctor = null;
      state.error = null;
    },
    setError: (state: DoctorsState, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearError: (state: DoctorsState) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Add Doctor
      .addCase(addDoctor.pending, (state) => {
        state.modal.loading = true;
        state.error = null;
      })
      .addCase(addDoctor.fulfilled, (state, action) => {
        state.modal.loading = false;
        state.modal.open = false;
        state.doctors.push(action.payload);
      })
      .addCase(addDoctor.rejected, (state, action) => {
        state.modal.loading = false;
        state.error = action.payload || 'Error al agregar médico';
      })
      // Update Doctor
      .addCase(updateDoctor.pending, (state) => {
        state.modal.loading = true;
        state.error = null;
      })
      .addCase(updateDoctor.fulfilled, (state, action) => {
        state.modal.loading = false;
        state.modal.open = false;
        const index = state.doctors.findIndex(
          (d) => d.id === action.payload.id,
        );
        if (index !== -1) {
          state.doctors[index] = action.payload;
        }
      })
      .addCase(updateDoctor.rejected, (state, action) => {
        state.modal.loading = false;
        state.error = action.payload || 'Error al actualizar médico';
      })
      // Delete Doctor
      .addCase(deleteDoctor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDoctor.fulfilled, (state, action) => {
        state.loading = false;
        state.doctors = state.doctors.filter((d) => d.id !== action.payload);
      })
      .addCase(deleteDoctor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Error al eliminar médico';
      });
  },
});

export const { setDoctors, openModal, closeModal, setError, clearError } =
  doctorsSlice.actions;

export const selectDoctors = (state: DoctorsRootState) => state.doctors.doctors;
export const selectSelectedDoctor = (state: DoctorsRootState) =>
  state.doctors.selectedDoctor;
export const selectDoctorsModal = (state: DoctorsRootState) =>
  state.doctors.modal;
export const selectDoctorsError = (state: DoctorsRootState) =>
  state.doctors.error;
export const selectDoctorsLoading = (state: DoctorsRootState) =>
  state.doctors.loading;

export default doctorsSlice.reducer;
