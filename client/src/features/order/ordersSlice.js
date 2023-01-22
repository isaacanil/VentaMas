import { createSlice } from '@reduxjs/toolkit'
import { nanoid } from 'nanoid';
import { getProviders } from '../../firebase/firebaseconfig';

const initialState = {
    orderFilterOptions: [
        {
            name: 'Estados',
            id: nanoid(8),
            isOpen: false,
            Items: [
                { name: 'estado 1' },
                { name: 'estado 2' },
                { name: 'estado 3' },
                { name: 'estado 4' },
                { name: 'estado 5' },
                { name: 'estado 6' },
                { name: 'estado 7' },
            ]
        },
        {
            name: 'Condicion',
            id: nanoid(8),
            isOpen: false,
            Items: [
                { name: 'condicion 1' },
                { name: 'condicion 2' },
                { name: 'condicion 3' },
                { name: 'condicion 4' },
                { name: 'condicion 5' },
                { name: 'condicion 6' },
                { name: 'condicion 7' },
            ]
        },
       
       
      
            
    ]
}

export const orderSlice = createSlice({
    name: 'order',
    initialState,
    reducers: {
        handleSetOptions: (state, actions) => {
            // Función para manejar opciones y actualizar estado
            const { optionsID, datas, propertyName } = actions.payload
            let newOptionGroup = {
                name: optionsID,
                id: nanoid(8),
                isOpen: false,
                Items: datas.map((item) => { return { ...item[propertyName], selected: false } })
            }
            // Buscando objeto existente
            let exist = state.orderFilterOptions.find(x => x.name === optionsID);
            // Si existe, lo actualiza
            if (exist) {
                // Recorriendo arreglo y reemplazando objeto existente
                let newFilterOptions = state.orderFilterOptions.map(x => x.name === optionsID ? newOptionGroup : x);
                // Retornando nuevo estado
                return { ...state, orderFilterOptions: newFilterOptions };
            }
            // Si no existe, lo agrega
            else {
                // Creando copia de estado y agregando nuevo objeto
                const newState = { ...state, orderFilterOptions: [...state.orderFilterOptions, newOptionGroup] };
                // Retornando nuevo estado
                return newState;
            }
        },
        handleOpenOptions: (state, actions) => { 
            const {id} = actions.payload
            //const newFilterOptions = state.orderFilterOptions.find((item)=>item.id === id)
            let newFilterOptions = state.orderFilterOptions.map((item) => {
                if (item.id === id) {
                  return { ...item, isOpen: !item.isOpen };
                } else if (item.id !== id) {
                  return { ...item, isOpen: false };
                }
              });
              state.orderFilterOptions = newFilterOptions
            
        }

    }
})

export const { handleOpenOptions, handleSetOptions } = orderSlice.actions;

//selectors
export const selectOrderFilterOptions = (state) => state.order.orderFilterOptions;

export default orderSlice.reducer