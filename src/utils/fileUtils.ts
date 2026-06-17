import {
  getFileExtension,
  getFileTypeFromUrl,
  getLocalURL as getOptionalLocalURL,
  isImageFile,
  isPdfFile,
  revokeObjectURL,
} from './files';

export {
  getFileExtension,
  getFileTypeFromUrl,
  isImageFile,
};

export function getLocalURL(file: File): string {
  if (!(file instanceof File)) {
    throw new Error('The provided parameter is not a File object.');
  }
  return getOptionalLocalURL(file);
}

export function revokeLocalURL(url?: string | null): void {
  if (url) {
    revokeObjectURL(url);
  }
}

export function isPDFFile(filename?: string | null): boolean {
  return isPdfFile(filename);
}
