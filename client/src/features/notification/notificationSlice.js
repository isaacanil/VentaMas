import { createSlice } from '@reduxjs/toolkit';

const initialState = {title: '', message: '', visible: false, type: null}

const notificationSlice = createSlice({
    name: 'notification',
    initialState,
    reducers: {
      addNotification: (state, action) => {
        const {message, title, type} = action.payload
        type ? state.type = type : null;
        message ? state.message = message : null;
        title ? state.title = title : null;
        state.visible = true;
    },
    removeNotification: (state) => {
        state.visible = false 
        state.message = ""
        state.title = ""
        state.type = null
      }
    }
  });
  export const { addNotification, removeNotification } = notificationSlice.actions;
  
  export const SelectNotification = (state) => state.notification
  export default notificationSlice.reducer;