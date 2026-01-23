import { useEffect, useRef } from 'react';

export const useBarcodeScanner = <T,>(
  products: T[],
  fn: (products: T[], barcode: string) => void,
) => {
  const barcodeRef = useRef('');

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      // Ignorar eventos que vengan de elementos input o textarea
      if (
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (event.key === 'Enter') {
        fn(products, barcodeRef.current);
        barcodeRef.current = '';
      } else {
        barcodeRef.current += event.key;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [products, fn]);
};
