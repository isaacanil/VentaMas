/**
 * Creates a local URL for a file object
 * @param {File} file - The file object to create URL for
 * @returns {string} The local URL for the file
 */
export const getLocalURL = (file) => {
  if (!file) return '';
  return URL.createObjectURL(file);
};

/**
 * Validates if a file is an image
 * @param {string} fileName - The name of the file
 * @returns {boolean} True if the file is an image
 */
export const isImageFile = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif'].includes(extension);
};

/**
 * Validates if a file is a PDF
 * @param {string} fileName - The name of the file
 * @returns {boolean} True if the file is a PDF
 */
export const isPdfFile = (fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  return extension === 'pdf';
};

/**
 * Revokes a local URL to free up memory
 * @param {string} url - The URL to revoke
 */
export const revokeLocalURL = (url) => {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
};
