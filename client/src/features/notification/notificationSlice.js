import { createSlice } from '@reduxjs/toolkit';

const initialState = {message: '', visible: false, type: null}

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
      addNotification: (state, action) => {
        const {message, type} = action.payload
        if(type){
            state.type = type
        }
        state.visible = true;
        state.message = message;
    },
    removeNotification: (state) => {
        state.visible = false 
      }
    }
  });
  export const { addNotification, removeNotification } = notificationSlice.actions;
  
  export const SelectNotification = (state) => state.notification
  export default notificationSlice.reducer;