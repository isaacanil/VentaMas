import { deleteObject, ref } from "firebase/storage";
import { storage } from "../firebase/firebaseconfig";

export const useDeleteImgFBStorage = (imgUrl) => {
    const imgRef = ref(storage, imgUrl)
    deleteObject(imgRef)
    .then(() => console.log(`deleted ${imgUrl}`))
    .catch((error) => { console.log(error) })
}