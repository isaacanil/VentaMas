import { toCanvas } from 'bwip-js';
import { useRef, useEffect, useState } from 'react';

const BarcodeItem = ({ name, number, barcodeType = 'code128' }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (canvasRef.current && number) {
      setIsLoading(true);
      setError(null);

      // Limpiar canvas anterior
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      try {
        const config = {
          bcid: barcodeType, // Tipo de código de barras dinámico
          text: String(number), // Asegurar que sea string
          scale: 3, // Factor de escala aumentado
          height: 12, // Altura en mm
          includetext: true, // Incluir texto
          textxalign: 'center', // Alineación del texto
          textsize: 10,
          padding: 0, // Tamaño del texto reducido
          textcolor: '000000', // Color del texto
          textyoffset: 4,
          backgroundcolor: 'FFFFFF', // Color de fondo
          //   textgaps: 1,           // Espaciado alrededor del texto
          //   textmargin: 6,         // Margen del texto
        };

        // Configuraciones específicas por tipo de código
        if (barcodeType === 'qrcode') {
          config.scale = 4;
          config.height = 20;
          delete config.includetext; // QR no necesita texto adicional
        }

        toCanvas(canvasRef.current, config);
        setIsLoading(false);
      } catch (e) {
        console.error('Error generando código de barras:', e);
        setError(e.message);
        setIsLoading(false);

        // Fallback: mostrar el texto si hay error
        const canvas = canvasRef.current;
        canvas.width = 200;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Error: ${number}`, canvas.width / 2, canvas.height / 2);
      }
    }
  }, [number, barcodeType]);

  return (
    <div
      style={{
        // Dimensiones en pulgadas para impresión
        minWidth: '0.6in', // ancho mínimo 0.6in
        maxWidth: '1.2in', // ancho máximo 1.2in
        width: '100%', // escala al contenedor hasta maxWidth
        height: name ? '1in' : '0.6in', // altura: 1in si hay nombre, 0.6in si no
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px dashed #ccc',
        margin: 0,
        padding: '8px',
        backgroundColor: '#fff',
      }}
    >
      {/* Nombre del producto - solo si existe */}
      {name && (
        <div
          style={{
            fontSize: '8px', // Reducido de 10px a 8px
            fontWeight: 'bold',
            textAlign: 'center',
            lineHeight: '1.2',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: '#333',
          }}
        >
          {name}
        </div>
      )}

      {/* Estado de carga */}
      {isLoading && (
        <div
          style={{
            fontSize: '10px',
            color: '#666',
            fontStyle: 'italic',
          }}
        >
          Generando código...
        </div>
      )}

      {/* Mostrar error si existe */}
      {error && (
        <div
          style={{
            fontSize: '10px',
            color: '#ff0000',
            textAlign: 'center',
            marginBottom: '4px',
          }}
        >
          Error: {error}
        </div>
      )}

      {/* Código de barras usando canvas */}
      <div
        style={{
          margin: 0,
          padding: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            height: 'auto',
            display: 'block',
          }}
        />
      </div>
    </div>
  );
};

export default BarcodeItem;
