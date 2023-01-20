import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';
import { getProviders } from '../../firebase/firebaseconfig';

const initialState = {
    orderFilterOptions: [
       
    ]
}

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        handleSelectOptions: (state, actions) => {
             // Función para manejar opciones y actualizar estado
            const {optionsID, datas} = actions.payload
            let newOptionGroup = {
                name: optionsID,
                Items: datas
            }
            // Buscando objeto existente
            let exist = state.orderFilterOptions.find(x => x.name === optionsID);
            // Si existe, lo actualiza
            if (exist) {
                // Recorriendo arreglo y reemplazando objeto existente
                let newFilterOptions = state.orderFilterOptions.map(x => x.name === optionsID ? newOptionGroup : x);
                // Retornando nuevo estado
                return {...state, orderFilterOptions: newFilterOptions};
            }
            // Si no existe, lo agrega
            else {
                // Creando copia de estado y agregando nuevo objeto
                const newState = {...state, orderFilterOptions: [...state.orderFilterOptions, newOptionGroup]};
                // Retornando nuevo estado
                return newState;
            }
        }

    }
})

export const { handleSelectOptions } = orderSlice.actions;

//selectors
export const selectOrderFilterOptions = (state) => state.order.orderFilterOptions;

export default orderSlice.reducer