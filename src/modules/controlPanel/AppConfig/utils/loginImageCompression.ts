import imageCompression from 'browser-image-compression';

export const LOGIN_IMAGE_STORAGE_PATH = 'app-config/login-image';

const TARGET_SIZE_MB = 0.4;
const MAX_DIMENSION = 1024;
const QUALITY_STEP = 0.1;
const MIN_QUALITY = 0.1;

export const resolveUploadFile = (compressedFile: File, originalFile: File) =>
  compressedFile.size < originalFile.size ? compressedFile : originalFile;

export const compressLoginImageIterative = async (
  file: File,
  onProgress: (progress: number) => void,
): Promise<File> => {
  const baseOptions = {
    maxWidthOrHeight: MAX_DIMENSION,
    useWebWorker: true,
    onProgress,
  };
  let quality = 0.8;
  let compressedFile = file;

  while (
    compressedFile.size / 1024 / 1024 > TARGET_SIZE_MB &&
    quality >= MIN_QUALITY
  ) {
    const options = {
      ...baseOptions,
      maxSizeMB: TARGET_SIZE_MB,
      initialQuality: quality,
    };
    compressedFile = await imageCompression(file, options);
    quality -= QUALITY_STEP;
  }

  return compressedFile;
};
