import { deleteObject, ref } from "firebase/storage";
import {  storage } from "../firebase/firebaseconfig";

export const useDeleteImgFBStorage = (imgUrl) => {
    const imgRef = ref(storage, imgUrl.url)
    console.log(imgUrl.url, imgRef)

    deleteObject(imgRef)
    .then(() => {
        console.log(`deleted ${imgUrl}`)
        fbDeleteProductImg(imgUrl.id)
    })
    .catch((error) => { console.log(error) })
}