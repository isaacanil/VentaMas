import { deleteObject, ref } from "firebase/storage";
import { DeleteProdImg, storage } from "../firebase/firebaseconfig";

export const useDeleteImgFBStorage = (imgUrl) => {
    const imgRef = ref(storage, imgUrl.url)
    console.log(imgUrl.url, imgRef)

    deleteObject(imgRef)
    .then(() => {
        console.log(`deleted ${imgUrl}`)
        DeleteProdImg(imgUrl.id)
    })
    .catch((error) => { console.log(error) })
}