import { useState, useEffect } from 'react';

const useImageFallback = (initialImageURL, fallbackImageURL) => {
 
  const [imageURL, setImageURL] = useState(initialImageURL);


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

  return [imageURL];
};

export default useImageFallback;