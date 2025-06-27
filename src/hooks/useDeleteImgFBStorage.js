import { deleteObject, ref } from "firebase/storage";
import {  storage } from "../firebase/firebaseconfig";

export const useDeleteImgFBStorage = (imgUrl) => {
    const imgRef = ref(storage, imgUrl.url)


    deleteObject(imgRef)
    .then(() => {
        // Image deleted successfully
        fbDeleteProductImg(imgUrl.id)
    })
    .catch((error) => { console.error('Error deleting image:', error) })
}