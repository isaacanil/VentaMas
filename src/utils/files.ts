import {
  getLocalURL as createLocalFileUrl,
  isImageFile,
  isPDFFile,
  revokeLocalURL as revokeFileUrl,
} from './fileUtils';

export const getLocalURL = (file?: Blob | MediaSource | null): string => {
  if (!file) return '';
  if (file instanceof File) {
    return createLocalFileUrl(file);
  }
  return URL.createObjectURL(file);
};

export { isImageFile };

export const isPdfFile = (fileName: string): boolean => isPDFFile(fileName);

export const revokeLocalURL = (url?: string | null): void => {
  if (!url || !url.startsWith('blob:')) return;
  revokeFileUrl(url);
};
