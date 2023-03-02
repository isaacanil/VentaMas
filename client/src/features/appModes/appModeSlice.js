import {createSlice} from '@reduxjs/toolkit';
import { useDispatch } from 'react-redux';
import {modes} from '../../constants/modes';
import { addNotification } from '../notification/NotificationSlice';

const appModeSlice = createSlice({
    name: 'appMode',
    initialState: {
        mode: true,
        notificationMode: modes.appMode.pruebas
    },
    reducers: {
        toggleMode: (state) => {
            const mode = state.mode
            state.mode = !mode
            
        }
    }
});

export const {toggleMode} = appModeSlice.actions;
export const selectAppMode = (state) => state.app.mode;
export default appModeSlice.reducer;

