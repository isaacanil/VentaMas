

export function isImageFile(file) {
    const acceptedImageTypes = ['image/gif', 'image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    return file && acceptedImageTypes.includes(file.type);
}