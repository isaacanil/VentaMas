import { useEffect, useState } from 'react';

export const useBarcodeScanner = (products, fn) => {
    let barcode = '';

    useEffect(() => {
      const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
          // Procesar el código de barras escaneado          
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


// export const useBarcodeScanner = (products, onScan) => {
//   let barcode = '';

//   useEffect(() => {
//     const handleBarcodeScan = (event) => {
//       // Evitar recoger entradas que no sean relevantes para un código de barras
//       if (event.type === 'keypress' && (event.key === 'Enter' || event.keyCode === 13)) {
//         if (barcode.length > 0) {
//           // Procesar el código de barras acumulado al presionar Enter
//           onScan(products, barcode.trim());
//           barcode = ''; // Reiniciar el acumulador de código de barras
//         }
//         event.preventDefault(); // Evitar cualquier acción por defecto de Enter
//       } else if (event.type === 'keydown' && event.key !== 'Enter') {
//         // Acumular los datos de entrada para cualquier tecla excepto Enter
//         barcode += event.key;
//       } else if (event.key === 'Enter') {
//         // Ignorar la entrada de Enter en keydown para no duplicar el procesamiento
//         event.preventDefault();
//       }
//     };

//     // Escuchar tanto keypress para Enter como keydown para el resto de las teclas
//     document.addEventListener('keypress', handleBarcodeScan);
//     document.addEventListener('keydown', handleBarcodeScan);

//     return () => {
//       // Asegurar la limpieza de los listeners al desmontar el componente
//       document.removeEventListener('keypress', handleBarcodeScan);
//       document.removeEventListener('keydown', handleBarcodeScan);
//     };
//   }, [products, onScan]); // Dependencias del efecto

//   // Nota: Dependiendo de la implementación específica del lector de códigos de barras,
//   // podría ser necesario ajustar la lógica de acumulación de código de barras.
// };


