import { message } from 'antd';
import imageCompression from 'browser-image-compression';

export const compressImage = async (file) => {
  const fileSize = file.size / (1024 * 1024);
  const options = {
    maxSizeMB: fileSize > 2 ? 1 : fileSize * 0.8,
    maxWidthOrHeight: 1200,
    useWebWorker: true,
    fileType: 'image/jpeg',
    initialQuality: fileSize > 2 ? 0.6 : 0.8,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    if (compressedFile.size > 2 * 1024 * 1024) {
      return imageCompression(compressedFile, {
        ...options,
        maxSizeMB: 1,
        initialQuality: 0.5,
      });
    }
    return compressedFile;
  } catch (error) {
    console.error('Error al comprimir la imagen', error);
    message.error('Error al comprimir la imagen');
    return null;
  }
};

export const beforeUpload = async (file) => {
  const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
  if (!isJpgOrPng) {
    message.error('Solo puedes subir archivos JPG/PNG!');
    return false;
  }

  try {
    const compressedFile = await compressImage(file);
    if (compressedFile) {
      const finalSize = (compressedFile.size / (1024 * 1024)).toFixed(2);
      message.success(`Imagen optimizada a ${finalSize}MB`);
      return compressedFile;
    }
    return false;
  } catch (error) {
    console.error('Error al procesar la imagen', error);
    message.error('Error al procesar la imagen');
    return false;
  }
};
