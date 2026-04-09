export function getLocalURL(file: File): string {
  if (!(file instanceof File)) {
    throw new Error('The provided parameter is not a File object.');
  }
  return URL.createObjectURL(file);
}

export function revokeLocalURL(url?: string | null): void {
  if (url) {
    URL.revokeObjectURL(url);
  }
}

export function isImageFile(filename?: string | null): boolean {
  if (!filename) return false;
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
}

export function isPDFFile(filename?: string | null): boolean {
  if (!filename) return false;
  return filename.split('.').pop()?.toLowerCase() === 'pdf';
}

export function getFileExtension(fileNameOrUrl: string): string {
  // Si es una URL de Firebase Storage
  if (
    typeof fileNameOrUrl === 'string' &&
    fileNameOrUrl.includes('firebasestorage.googleapis.com')
  ) {
    const decodedUrl = decodeURIComponent(fileNameOrUrl);
    const match = decodedUrl.match(/[^/]+\.([^?]+)(?=\?|$)/i);
    return match ? match[1].toLowerCase() : '';
  }

  // Para archivos locales o nombres de archivo normales
  return fileNameOrUrl.split('.').pop()?.toLowerCase() ?? '';
}

export function getFileTypeFromUrl(url: string): 'image' | 'pdf' | 'other' {
  const extension = getFileExtension(url);
  if (isImageFile(`.${extension}`)) return 'image';
  if (isPDFFile(`.${extension}`)) return 'pdf';
  return 'other';
}
