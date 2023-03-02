import { createSlice } from '@reduxjs/toolkit'

const initialState = {
    img: null,
    url: null,
    loading: false,
    status: 0,
}
export const UploadImgSlice = createSlice({
    name: 'uploadImg',
    initialState,
    reducers: {
        SaveImg: (state, action) => {
            const {img, url} = action.payload;
            console.log(img)
            if(img){state.img = img};
            if(url){state.url = url};
        },  
        clearImg: (state) => {
            state.img = null
            state.url = null
        },
        UploadProgress: (state, action) => {
            const {progress} = action.payload
            console.log(progress)
            state.status = progress || 0;
           
        },
        UploadImgLoading: (state, action) => {
            state.loading = action.payload
        }
        
    }
})

export const { SaveImg, clearImg, UploadImgLoading, UploadProgress } = UploadImgSlice.actions;

//selectors
export const selectImg = (state) => state.uploadImg.img;
export const selectUploadImageUrl = (state) => state.uploadImg.url;
export const selectUploadImageLoading = (state) => state.uploadImg.loading;
export const selectUploadImageStatus = (state) => state.uploadImg.status;

export default UploadImgSlice.reducer