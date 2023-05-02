import { useEffect, useState } from 'react';
import { useMatch } from 'react-router-dom';
import Products from '../../views/pages/Registro/BillDataPreview/components/Products';

const useBarcodeScanner = (products, fn) => {
    let barcode = '';

    useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
          // Procesar el código de barras escaneado
          console.log('---------------------Código de barras: ', barcode);
          
            fn(products, barcode)

          barcode = '';
        } else {
          barcode += event.key;

        }
      };
  
      document.addEventListener('keydown', handleKeyDown);
  
      // Limpieza al desmontar el componente
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [products]);
};

export default useBarcodeScanner;
