import { storage } from "../firebaseconfig";

export const deletePurchaseData = () => {
    
}
export const deletePurchaseImg = (purchaseId) => {
    const storageRef = ref(storage, `purchase/${purchaseId}`)
  
}
