import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { nanoid } from 'nanoid';

import { storage } from '../firebaseconfig';

// Validación de archivos
export const validateFile = (file, allowedTypes = [], maxSize = null) => {
  if (!file) throw new Error('Invalid file');
  if (allowedTypes.length && !allowedTypes.includes(file.type)) {
    throw new Error(`Unsupported type: ${file.type}`);
  }
  if (maxSize && file.size > maxSize) {
    throw new Error(`File too large: ${file.size} bytes`);
  }
};

// Crear referencia de almacenamiento
export const createStorageRef = (
  storage,
  businessID,
  sectionName,
  fileName,
  normalize = true,
) => {
  const processedName = normalize
    ? fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
    : fileName;
  return ref(
    storage,
    `businesses/${businessID}/${sectionName}/${nanoid()}${processedName}`,
  );
};

// Subir un archivo único
export const uploadSingleFile = async (
  storageRef,
  file,
  metadata,
  onProgress = () => {},
  onGlobalProgress = () => {},
) => {
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    const unsubscribe = uploadTask.on(
      'state_changed',
      (snapshot) => {
        onProgress(snapshot, file);
        onGlobalProgress(snapshot);
      },
      (error) => reject(error),
      async () => {
        try {
          const url = await getDownloadURL(storageRef);
          resolve({
            url,
            location: 'remote',
            name: file.name,
            mimeType: file.type,
            size: file.size,
            uploadedAt: Date.now(),
          });
        } catch (error) {
          reject(error);
        }
      },
    );
    // Cleanup subscription on error
    uploadTask.catch((error) => {
      unsubscribe();
      reject(error);
    });
  });
};

// Validación de nombre de sección
export const validateSectionName = (sectionName) => {
  if (!sectionName || typeof sectionName !== 'string') {
    throw new Error('Invalid section name');
  }
  // Optional: Add more specific validation rules
  if (!/^[a-zA-Z0-9-_]+$/.test(sectionName)) {
    throw new Error('Section name contains invalid characters');
  }
};

export const fbUploadFile = async (user, sectionName, file, options = {}) => {
  const {
    allowedTypes = [],
    maxSizeInBytes = null,
    onProgress = () => {},
    customMetadata = {},
    normalizeFileName = true,
  } = options;

  if (!user.businessID) {
    throw new Error('No businessID provided');
  }

  validateSectionName(sectionName);
  validateFile(file, allowedTypes, maxSizeInBytes);

  const storageRef = createStorageRef(
    storage,
    user.businessID,
    sectionName,
    file.name,
    normalizeFileName,
  );

  const metadata = { contentType: file.type, ...customMetadata };

  return await uploadSingleFile(storageRef, file, metadata, onProgress);
};

export const fbUploadFiles = async (user, sectionName, files, options = {}) => {
  const {
    fileProperty = null,
    allowedTypes = [],
    maxSizeInBytes = null,
    onProgress = () => {},
    updateGlobalProgress = () => {},
    customMetadata = {},
    normalizeFileName = true,
    handleErrorsIndividually = false,
    addTimestamp = false,
  } = options;

  if (!user.businessID) {
    throw new Error('No businessID provided');
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Files must be a non-empty array');
  }

  const totalBytes = files.reduce((sum, fileObj) => {
    const file = fileProperty ? fileObj[fileProperty] : fileObj;
    return sum + (file?.size || 0);
  }, 0);

  let totalBytesTransferred = 0;

  const results = await Promise.allSettled(
    files.map(async (fileObj) => {
      const file = fileProperty ? fileObj[fileProperty] : fileObj;

      try {
        validateFile(file, allowedTypes, maxSizeInBytes);
        validateSectionName(sectionName);

        const storageRef = createStorageRef(
          storage,
          user.businessID,
          sectionName,
          file.name,
          normalizeFileName,
        );

        const metadata = {
          contentType: file.type,
          ...customMetadata,
        };

        const result = await uploadSingleFile(
          storageRef,
          file,
          metadata,
          onProgress,
          (snapshot) => {
            totalBytesTransferred += snapshot.bytesTransferred;
            updateGlobalProgress({
              totalBytes,
              totalBytesTransferred,
              progress: (totalBytesTransferred / totalBytes) * 100,
            });
          },
        );

        return addTimestamp ? { ...result, timestamp: Date.now() } : result;
      } catch (error) {
        if (handleErrorsIndividually) {
          return { error: error.message, fileName: file.name };
        }
        throw error;
      }
    }),
  );

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : result.reason,
  );
};
