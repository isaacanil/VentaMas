import { ref, uploadBytesResumable } from "firebase/storage"
import { UploadImgLoading, UploadProgress } from "../../features/uploadImg/uploadImageSlice"
import { db, storage } from "../firebaseconfig"
import { getDownloadURL } from "firebase/storage"
import { SaveImg } from "../../features/uploadImg/uploadImageSlice"
import { addNotification } from "../../features/notification/NotificationSlice"
import { nanoid } from "nanoid"
import { doc, updateDoc } from "firebase/firestore"
import { update } from "lodash"
import { addReceiptImageToPurchase } from "../../features/Purchase/addPurchaseSlice"


export const fbAddPurchaseReceiptImg = (user, dispatch, file, orderId) => {
    if(!user || !user?.businessID) return;
   
    if (!file || !file.type || !file.type.startsWith('image/')) {
        dispatch(addNotification({ title: 'Error', message: 'El archivo seleccionado no es una imagen', type: 'error' }));
        return;
    }
    const storageRef = ref(storage, `/businesses/${user.businessID}/purchaseOrderReceipt/${nanoid(12)}.jpg`)
    const uploadFile = uploadBytesResumable(storageRef, file)
    dispatch(UploadImgLoading(true))
    // dispatch(UploadProgress({ progress: 0 }))
    uploadFile.on('state_changed',
        (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log('Upload is ' + progress + '% done');
            dispatch(UploadProgress({ progress }));
        },
        (error) => {
            console.log(error)
            dispatch(UploadImgLoading(false))
        },
        async () => {
            getDownloadURL(storageRef).then((url) => {
                dispatch(UploadImgLoading(false))
                dispatch(addReceiptImageToPurchase(url))
                dispatch(SaveImg({ url }))
                fbAddReceiptImageToOrderDoc(user, orderId, url);
                dispatch(UploadProgress({ progress: 100 }));
            })
        }
    )
}

const fbAddReceiptImageToOrderDoc = (user, orderId, url) => {
    if(!user || !user?.businessID) return;

    const orderRef = doc(db, 'businesses', user.businessID, 'orders', orderId);
    try {
        updateDoc(orderRef, {
            'data.receiptImgUrl': url
        });
    } catch (error) {
        console.error("Error updating document: ", error);
    }


}
