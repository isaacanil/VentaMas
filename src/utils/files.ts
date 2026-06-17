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

type GetFileExtensionOptions = {
  includeDot?: boolean;
};

const formatFileExtension = (
  extension: string,
  options: GetFileExtensionOptions = {},
): string => {
  if (!extension) return '';
  return options.includeDot ? `.${extension}` : extension;
};

export function isImageFile(filename?: string | null): boolean {
  return ['jpg', 'jpeg', 'png', 'gif'].includes(getFileExtension(filename));
}

export function isPdfFile(filename?: string | null): boolean {
  return getFileExtension(filename) === 'pdf';
}

export const isPDFFile = isPdfFile;

export function getFileExtension(
  fileNameOrUrl?: string | null,
  options: GetFileExtensionOptions = {},
): string {
  if (!fileNameOrUrl) return '';

  if (
    typeof fileNameOrUrl === 'string' &&
    fileNameOrUrl.includes('firebasestorage.googleapis.com')
  ) {
    const decodedUrl = decodeURIComponent(fileNameOrUrl);
    const filePath = decodedUrl.split('?')[0] ?? '';
    const fileName = filePath.split('/').pop() ?? '';
    const extension = fileName.includes('.')
      ? (fileName.split('.').pop()?.toLowerCase() ?? '')
      : '';
    return formatFileExtension(extension, options);
  }

  const extension = fileNameOrUrl.split('.').pop()?.toLowerCase() ?? '';
  return formatFileExtension(extension, options);
}

export function getFileTypeFromUrl(url: string): 'image' | 'pdf' | 'other' {
  const extension = getFileExtension(url);
  if (isImageFile(`.${extension}`)) return 'image';
  if (isPdfFile(`.${extension}`)) return 'pdf';
  return 'other';
}
