import { deleteObject, getDownloadURL, ref } from "firebase/storage"
import { fbDeleteProductImgData } from "./fbDeleteProductImgData"
import { storage } from "../../firebaseconfig";

export const fbDeleteProductImg = (user, img) => {
    const imgRef = ref(storage, img.url);

    getDownloadURL(imgRef)
        .then(() => {
            // El archivo existe, procedemos a eliminarlo
            deleteObject(imgRef)
                .then(() => {
                    console.log(`deleted ${img}`);
                    fbDeleteProductImgData(user, img.id);
                })
                .catch((error) => {
                    console.log(`Error deleting image: ${error}`);
                });
        })
        .catch((error) => {
            // El archivo no existe, procedemos a eliminar el documento
            console.log(`Image does not exist, deleting document: ${error}`);
            fbDeleteProductImgData(user, img.id);
        });
}

