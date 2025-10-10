import { deleteObject, getDownloadURL, ref } from "firebase/storage";

import { storage } from "../firebaseconfig";


export const fbDeleteImage = async (imgUrl) => {
    const imgRef = ref(storage, imgUrl);

    try {
        // Intenta obtener la URL de descarga para verificar si el archivo existe
        await getDownloadURL(imgRef);

        // Si el archivo existe, procedemos a eliminarlo
        await deleteObject(imgRef);
        // Image deleted successfully
    } catch (error) {
        console.error(`Error deleting image: ${error}`);
    }
}