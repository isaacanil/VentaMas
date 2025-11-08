export function isValidURL(str) {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  }

export function isImageUrl(url) {
  if (!isValidURL(url)) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  return imageExtensions.some(ext => url.endsWith(ext));
}

export function isFirebaseStorageUrl(url) {
  // Handle direct string URLs
  if (typeof url === 'string') {
    return isValidURL(url) && url.includes('firebasestorage.googleapis.com');
  }
  
  // Handle object URLs with a nested url property
  if (url && typeof url === 'object' && typeof url.url === 'string') {
    return isValidURL(url.url) && url.url.includes('firebasestorage.googleapis.com');
  }
  
  return false;
}