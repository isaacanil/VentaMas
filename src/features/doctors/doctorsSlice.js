import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

import { fbAddDoctor } from '../../firebase/doctors/fbAddDoctor';
import { fbCheckDoctorExists } from '../../firebase/doctors/fbCheckDoctorExists';
import { fbDeleteDoctor } from '../../firebase/doctors/fbDeleteDoctor';
import { fbUpdateDoctor } from '../../firebase/doctors/fbUpdateDoctor';

// Async thunks
export const addDoctor = createAsyncThunk(
    'doctors/add',
    async ({ doctor, user }, { rejectWithValue }) => {
        try {
            // Check if doctor already exists
            const duplicates = await fbCheckDoctorExists(
                user.businessID, 
                doctor.name, 
                doctor.specialty
            );
            
            if (duplicates.exists) {
                return rejectWithValue(duplicates.message);
            }
            
            const doctorId = await fbAddDoctor(doctor, user);
            return { ...doctor, id: doctorId };
        } catch (error) {
            return rejectWithValue(error.message || 'Error al agregar médico');
        }
    }
);

export const updateDoctor = createAsyncThunk(
    'doctors/update',
    async ({ doctor, user }, { rejectWithValue }) => {
        try {
            // Check if doctor already exists (excluding current doctor)
            const duplicates = await fbCheckDoctorExists(
                user.businessID, 
                doctor.name, 
                doctor.specialty,
                doctor.id
            );
            
            if (duplicates.exists) {
                return rejectWithValue(duplicates.message);
            }
            
            await fbUpdateDoctor(doctor, user);
            return doctor;
        } catch (error) {
            return rejectWithValue(error.message || 'Error al actualizar médico');
        }
    }
);

export const deleteDoctor = createAsyncThunk(
    'doctors/delete',
    async ({ doctorId, user }, { rejectWithValue }) => {
        try {
            await fbDeleteDoctor(doctorId, user);
            return doctorId;
        } catch (error) {
            return rejectWithValue(error.message || 'Error al eliminar médico');
        }
    }
);

const initialState = {
    doctors: [],
    selectedDoctor: null,
    modal: {
        open: false,
        mode: 'add', // 'add' or 'edit'
        loading: false
    },
    loading: false,
    error: null
};

const doctorsSlice = createSlice({
    name: 'doctors',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null;
        },
        setSelectedDoctor: (state, action) => {
            state.selectedDoctor = action.payload;
        },
        clearSelectedDoctor: (state) => {
            state.selectedDoctor = null;
        },
        openModal: (state, action) => {
            state.modal.open = true;
            state.modal.mode = action.payload?.mode || 'add';
            if (action.payload?.doctor) {
                state.selectedDoctor = action.payload.doctor;
            }
        },
        closeModal: (state) => {
            state.modal.open = false;
            state.modal.mode = 'add';
            state.selectedDoctor = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Add doctor
            .addCase(addDoctor.pending, (state) => {
                state.modal.loading = true;
                state.error = null;
            })
            .addCase(addDoctor.fulfilled, (state, action) => {
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
            .addCase(updateDoctor.fulfilled, (state, action) => {
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
            .addCase(deleteDoctor.fulfilled, (state, action) => {
                state.loading = false;
                // Note: The doctor will be removed from the list via the real-time listener
            })
            .addCase(deleteDoctor.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    }
});

export const {
    clearError,
    setSelectedDoctor,
    clearSelectedDoctor,
    openModal,
    closeModal
} = doctorsSlice.actions;

// Selectors
export const selectDoctors = (state) => state.doctors.doctors;
export const selectSelectedDoctor = (state) => state.doctors.selectedDoctor;
export const selectDoctorsModal = (state) => state.doctors.modal;
export const selectDoctorsLoading = (state) => state.doctors.loading;
export const selectDoctorsError = (state) => state.doctors.error;

export default doctorsSlice.reducer; 