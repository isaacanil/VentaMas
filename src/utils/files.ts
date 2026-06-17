export const createLocalObjectURL = (file: Blob | MediaSource): string =>
  URL.createObjectURL(file);

export const getLocalURL = (file?: Blob | MediaSource | null): string => {
  if (!file) return '';
  return createLocalObjectURL(file);
};

export const revokeObjectURL = (url?: string | null): void => {
  if (!url) return;
  URL.revokeObjectURL(url);
};

export const revokeLocalURL = (url?: string | null): void => {
  if (!url || !url.startsWith('blob:')) return;
  revokeObjectURL(url);
};

export function isImageFile(filename?: string | null): boolean {
  if (!filename) return false;
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
}

export function isPdfFile(filename?: string | null): boolean {
  if (!filename) return false;
  return filename.split('.').pop()?.toLowerCase() === 'pdf';
}

export const isPDFFile = isPdfFile;

export function getFileExtension(fileNameOrUrl: string): string {
  if (
    typeof fileNameOrUrl === 'string' &&
    fileNameOrUrl.includes('firebasestorage.googleapis.com')
  ) {
    const decodedUrl = decodeURIComponent(fileNameOrUrl);
    const match = decodedUrl.match(/[^/]+\.([^?]+)(?=\?|$)/i);
    return match ? match[1].toLowerCase() : '';
  }

  return fileNameOrUrl.split('.').pop()?.toLowerCase() ?? '';
}

export function getFileTypeFromUrl(url: string): 'image' | 'pdf' | 'other' {
  const extension = getFileExtension(url);
  if (isImageFile(`.${extension}`)) return 'image';
  if (isPdfFile(`.${extension}`)) return 'pdf';
  return 'other';
}
