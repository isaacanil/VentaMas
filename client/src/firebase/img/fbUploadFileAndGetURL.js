import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebaseconfig';
import { nanoid } from 'nanoid';


export const fbUploadFileAndGetURL = async (user, sectionName, file) => {
  if (!user.businessID) {
    throw new Error("No businessID provided");
  }

  const storageRef = ref(storage, `businesses/${user.businessID}/${sectionName}/${nanoid()}.jpg`);

  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on('state_changed',
      (snapshot) => { /* puedes monitorear el progreso aquí si quieres */ },
      (error) => {
        reject(error);
      },
      () => {
        getDownloadURL(storageRef)
          .then((url) => {
            console.log('File available at', url);
            resolve(url);
          });
      }
    );
  });
}
