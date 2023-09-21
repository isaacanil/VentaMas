import { deleteObject, getDownloadURL, ref } from "firebase/storage";
import { storage } from "../firebaseconfig";


export const fbDeleteImage = async (imgUrl) => {
    const imgRef = ref(storage, imgUrl);

    try {
        // Intenta obtener la URL de descarga para verificar si el archivo existe
        await getDownloadURL(imgRef);

        // Si el archivo existe, procedemos a eliminarlo
        await deleteObject(imgRef);
        console.log(`deleted ${imgUrl}`);
    } catch (error) {
        console.log(`Error deleting image: ${error}`);
    }
}