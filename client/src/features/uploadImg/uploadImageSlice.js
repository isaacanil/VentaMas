import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    img: null
}
export const UploadImgSlice = createSlice({
    name: 'uploadImg',
    initialState,
    reducers: {
        SaveImg: (state, action) => {
            state.img = action.payload
        },
        clearImg: (state) => {
            state.img = null
        }
    }
})

export const { SaveImg, clearImg } = UploadImgSlice.actions;

//selectors
export const selectImg = (state) => state.uploadImg.img;
export default UploadImgSlice.reducer