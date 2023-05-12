
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseconfig";
import { v4 } from 'uuid';

export const fbAddProductImg = (user, file) => {
    if (!user || !user?.businessID) { return }
    const storageRef = ref(storage, `businesses/${user.businessID}/productsImages/${v4()}.jpg`)
    return new Promise((resolve, reject) => {
        uploadBytes(storageRef, file)
            .then((snapshot) => {
                getDownloadURL(storageRef)
                    .then((url) => {
                        console.log('File available at', url);
                        resolve(url);
                    })

            })
            .catch((error) => {
                console.log(error);
                reject(error);
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