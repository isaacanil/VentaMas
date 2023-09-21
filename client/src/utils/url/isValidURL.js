export function isValidURL(str) {
    try {
      new URL(str);
      return true;
    } catch (e) {
      return false;
    }
  }

export function isImageUrl(url) {
  if (!isValidURL(url)) return false;
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp'];
  console.log("isImageUrl: ", url);
  console.log("isImageUrl: ", isValidURL(url));
  console.log("isImageUrl: ", imageExtensions.some(ext => url.endsWith(ext)));
  return imageExtensions.some(ext => url.endsWith(ext));
}

export function isFirebaseStorageUrl(url) {
  return isValidURL(url) && url.includes('firebasestorage.googleapis.com');
}