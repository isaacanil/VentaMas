import { createSlice } from '@reduxjs/toolkit';
import { defineAbilitiesFor } from '../../abilities';

const initialState = {
    abilities: defineAbilitiesFor({ role: 'guest' }), // Define un rol por defecto
};

const abilitiesSlice = createSlice({
    name: 'abilities',
    initialState,
    reducers: {
        setAbilities: (state, action) => {
            state.abilities = defineAbilitiesFor(action.payload);
        },
    },
});

export const { setAbilities } = abilitiesSlice.actions;

export default abilitiesSlice.reducer;

export const selectAbilities = (state) => state.abilities.abilities;
