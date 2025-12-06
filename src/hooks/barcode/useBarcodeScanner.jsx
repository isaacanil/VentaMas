import { useEffect } from 'react';

export const useBarcodeScanner = (products, fn) => {
  let barcode = '';

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ignorar eventos que vengan de elementos input o textarea
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (event.key === 'Enter') {
        fn(products, barcode);
        barcode = '';
      } else {
        barcode += event.key;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [products]);
};
