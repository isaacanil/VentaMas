// features/businesses/businessesSlice.js
import { createSlice } from '@reduxjs/toolkit';

export const fetchBusinesses = createAsyncThunk(
    'businesses/fetchBusinesses',
    async () => {
        const response = await fetch('https://api.example.com/businesses');
        const businesses = await response.json();
        return businesses;
    }
);

const businessesSlice = createSlice({
    name: 'businesses',
    initialState: {
        businessEditModal: {
            isOpen: false,
        }
    },
    reducers: {
        toggleBusinessEditModal: (state) => {
            state.businessEditModal.isOpen = !state.businessEditModal.isOpen;
        }

    },

});

// Exportamos las acciones
export const { toggleBusinessEditModal } = businessesSlice.actions;


// Exportamos los reducers para ser utilizados en la configuración de la store
export default businessesSlice.reducer;
