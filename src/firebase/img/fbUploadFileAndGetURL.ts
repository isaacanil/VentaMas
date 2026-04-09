import {
  getDownloadURL,
  ref,
  uploadBytesResumable,
  type FirebaseStorage,
  type StorageReference,
  type UploadMetadata,
  type UploadTaskSnapshot,
} from 'firebase/storage';
import { nanoid } from 'nanoid';

import { storage } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';

export interface UploadResult {
  url: string;
  location: 'remote';
  name: string;
  mimeType: string;
  size: number;
  uploadedAt: number;
  timestamp?: number;
}

export interface UploadError {
  error: string;
  fileName: string;
}

export interface UploadGlobalProgress {
  totalBytes: number;
  totalBytesTransferred: number;
  progress: number;
}

export type UploadProgressHandler = (
  snapshot: UploadTaskSnapshot,
  file?: File,
) => void;

export type GlobalProgressHandler = (snapshot: UploadTaskSnapshot) => void;

export interface UploadOptions {
  allowedTypes?: string[];
  maxSizeInBytes?: number | null;
  onProgress?: UploadProgressHandler;
  customMetadata?: Record<string, string>;
  normalizeFileName?: boolean;
}

export interface UploadFilesOptions extends UploadOptions {
  fileProperty?: string | null;
  updateGlobalProgress?: (payload: UploadGlobalProgress) => void;
  handleErrorsIndividually?: boolean;
  addTimestamp?: boolean;
}

// Validacion de archivos
export const validateFile = (
  file: File,
  allowedTypes: string[] = [],
  maxSize: number | null = null,
): void => {
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
  targetStorage: FirebaseStorage,
  businessID: string,
  sectionName: string,
  fileName: string,
  normalize = true,
): StorageReference => {
  const processedName = normalize
    ? fileName.replace(/[^a-z0-9.]/gi, '_').toLowerCase()
    : fileName;
  return ref(
    targetStorage,
    `businesses/${businessID}/${sectionName}/${nanoid()}${processedName}`,
  );
};

// Subir un archivo unico
export const uploadSingleFile = async (
  storageRef: StorageReference,
  file: File,
  metadata?: UploadMetadata,
  onProgress?: UploadProgressHandler,
  onGlobalProgress?: GlobalProgressHandler,
): Promise<UploadResult> => {
  const uploadTask = uploadBytesResumable(storageRef, file, metadata);

  return new Promise((resolve, reject) => {
    const unsubscribe = uploadTask.on(
      'state_changed',
      (snapshot) => {
        onProgress?.(snapshot, file);
        onGlobalProgress?.(snapshot);
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

// Validacion de nombre de seccion
export const validateSectionName = (sectionName: string): void => {
  if (!sectionName || typeof sectionName !== 'string') {
    throw new Error('Invalid section name');
  }
  // Optional: Add more specific validation rules
  if (!/^[a-zA-Z0-9-_]+$/.test(sectionName)) {
    throw new Error('Section name contains invalid characters');
  }
};

const resolveFile = (
  fileObj: File | Record<string, File>,
  fileProperty?: string | null,
): File => {
  if (fileProperty && typeof fileObj === 'object' && fileProperty in fileObj) {
    const candidate = fileObj[fileProperty];
    if (candidate instanceof File) {
      return candidate;
    }
  }

  if (fileObj instanceof File) {
    return fileObj;
  }

  throw new Error('Invalid file entry');
};

export const fbUploadFile = async (
  user: UserIdentity,
  sectionName: string,
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  const {
    allowedTypes = [],
    maxSizeInBytes = null,
    onProgress,
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

export const fbUploadFiles = async (
  user: UserIdentity,
  sectionName: string,
  files: Array<File | Record<string, File>>,
  options: UploadFilesOptions = {},
): Promise<Array<UploadResult | UploadError>> => {
  const {
    fileProperty = null,
    allowedTypes = [],
    maxSizeInBytes = null,
    onProgress,
    updateGlobalProgress = () => undefined,
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
    const file = resolveFile(fileObj, fileProperty);
    return sum + (file?.size || 0);
  }, 0);

  let totalBytesTransferred = 0;

  const results = await Promise.allSettled(
    files.map(async (fileObj) => {
      const file = resolveFile(fileObj, fileProperty);

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

        const metadata: UploadMetadata = {
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
          const message =
            error instanceof Error ? error.message : String(error);
          return { error: message, fileName: file.name };
        }
        throw error;
      }
    }),
  );

  return results.map((result) =>
    result.status === 'fulfilled' ? result.value : result.reason,
  );
};
