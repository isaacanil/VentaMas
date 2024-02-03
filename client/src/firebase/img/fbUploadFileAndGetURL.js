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

export const fbAddMultipleFilesAndGetURLs = async (user, sectionName, files) => {
  if (!user.businessID) {
    throw new Error("No businessID provided");
  }

  const urls = await Promise.all(files.map(file => {
    // Crear una referencia única para cada archivo
    const storageRef = ref(storage, `businesses/${user.businessID}/${sectionName}/${nanoid()}${file.name}`);
    const metadata = { contentType: file.type };
    // Subir el archivo
    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed',
        (snapshot) => { /* puedes monitorear el progreso aquí si quieres */ },
        (error) => {
          // Manejo de errores para cada archivo
          console.error("Error uploading file:", file.name, error);
          reject(error);
        },
        () => {
          // Obtener la URL de descarga para cada archivo subido con éxito
          getDownloadURL(storageRef)
            .then((url) => {
              console.log('File available at', url);
              resolve({
                url,
                name: file.name,
                type: file.type,
                size: file.size,
              });
            });
        }
      );
    });
  }));

  return urls; // Retorna un arreglo de URLs
}
