import { ref, uploadBytesResumable } from "firebase/storage"
import { useDispatch } from "react-redux"
import { v4 } from "uuid"
import { UploadImgLoading, UploadProgress } from "../../features/uploadImg/uploadImageSlice"
import { storage } from "../firebaseconfig"
import { getDownloadURL } from "firebase/storage"
import { SaveImg } from "../../features/uploadImg/uploadImageSlice"
import { addNotification } from "../../features/notification/NotificationSlice"


export const fbAddPurchaseReceiptImg = (dispatch, file) => {
   
    if (!file || !file.type || !file.type.startsWith('image/')) {
        dispatch(addNotification({ title: 'Error', message: 'El archivo seleccionado no es una imagen', type: 'error' }));
        return;
    }
    const storageRef = ref(storage, `purchaseOrderReceipt/${v4()}.jpg`)
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
                dispatch(SaveImg({ url }))
                dispatch(UploadProgress({ progress: 100 }));
            })
        }
    )

}

const fbAddPurchaseImage = (purchaseId, image) => {
    const storageRef = ref(storage, `purchase/${purchaseId}`)
    return uploadBytes(storageRef, image)
}