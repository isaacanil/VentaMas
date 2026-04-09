import { useState, useEffect } from 'react';

const useImageFallback = (
  initialImageURL: string,
  fallbackImageURL: string,
) => {
  const [imageURL, setImageURL] = useState<string>(initialImageURL);

  useEffect(() => {
    const loadImage = () => {
      const img = new Image();
      img.src = initialImageURL;
      img.onload = () => {
        setImageURL(initialImageURL);
      };
      img.onerror = () => {
        setImageURL(fallbackImageURL);
      };
    };

    loadImage();
  }, [initialImageURL, fallbackImageURL]);

  return [imageURL] as const;
};

export default useImageFallback;
