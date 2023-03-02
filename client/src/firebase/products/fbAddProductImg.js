
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseconfig";
import { v4 } from 'uuid';

export const fbAddProductImg = (file) => {
    const today = new Date();
    const hour = `${today.getHours()}:${today.getMinutes()}`
    const storageRef = ref(storage, `products/${v4()}.jpg`)
    return new Promise((resolve, reject) => {
        uploadBytes(storageRef, file)
            .then((snapshot) => {
                getDownloadURL(storageRef)
                    .then((url) => {
                        console.log('File available at', url);
                        resolve(url);
                    });
            })
    })
}
export const fbAddReceiptPurchaseImg = (file) => {
    const today = new Date();
    const hour = `${today.getHours()}:${today.getMinutes()}`
    const storageRef = ref(storage, `receiptPurchaseImg/${v4()}.jpg`)
    return new Promise((resolve, reject) => {
        uploadBytes(storageRef, file)
            .then((snapshot) => {
                getDownloadURL(storageRef)
                    .then((url) => {
                        console.log('File available at', url);
                        resolve(url);
                    });
            })
    })
}