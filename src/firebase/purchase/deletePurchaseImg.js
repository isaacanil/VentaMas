import { ref } from "firebase/storage";

import { storage } from "../firebaseconfig";

export const deletePurchaseData = () => {
    
}
export const deletePurchaseImg = (purchaseId) => {
    const _storageRef = ref(storage, `purchase/${purchaseId}`)
    // TODO: Implementar eliminación de imagen
}
