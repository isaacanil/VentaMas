import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../../firebaseconfig";
import { v4 } from 'uuid';

export const fbAddProductImg = (user, file, onProgress) => {
    return new Promise((resolve, reject) => {
        if (!user || !user?.businessID) {
            console.error('Invalid user or businessID');
            reject('Invalid user or businessID');
            return;
        }

        const storageRef = ref(storage, `businesses/${user.businessID}/productsImages/${v4()}.jpg`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
                if (onProgress) {
                    onProgress(progress);
                }
            },
            (error) => {
                console.error(error);
                reject(error);
            },
            () => {
                getDownloadURL(uploadTask.snapshot.ref)
                    .then(downloadURL => {
                        console.log('File available at', downloadURL);
                        resolve(downloadURL);
                    })
                    .catch(error => {
                        console.error(error);
                        reject(error);
                    });
            }
        );
    });
};

