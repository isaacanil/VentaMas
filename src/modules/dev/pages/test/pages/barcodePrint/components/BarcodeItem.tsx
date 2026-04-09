import { useRef, useEffect, useReducer } from 'react';

type BarcodeType = 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'qrcode';

interface BarcodeItemProps {
  name?: string | null;
  number: string | number;
  barcodeType?: BarcodeType;
}

const bwipJsPromise = import('bwip-js');

const BarcodeItem = ({
  name,
  number,
  barcodeType = 'code128',
}: BarcodeItemProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [status, dispatch] = useReducer(
    (
      state: { error: string | null; isLoading: boolean },
      action:
        | { type: 'start' }
        | { type: 'success' }
        | { type: 'error'; payload: string },
    ) => {
      switch (action.type) {
        case 'start':
          return { error: null, isLoading: true };
        case 'success':
          return { error: null, isLoading: false };
        case 'error':
          return { error: action.payload, isLoading: false };
        default:
          return state;
      }
    },
    { error: null, isLoading: true },
  );
  const { error, isLoading } = status;

  useEffect(() => {
    let isMounted = true;
    const generateBarcode = () => {
      if (canvasRef.current && number) {
        if (isMounted) {
          dispatch({ type: 'start' });
        }

        // Limpiar canvas anterior
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        bwipJsPromise
          .then(({ toCanvas }) => {
            if (!isMounted || !canvasRef.current) return;

            const config: Record<string, unknown> = {
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
            if (isMounted) dispatch({ type: 'success' });
          })
          .catch((e) => {
            console.error('Error generando código de barras:', e);
            if (isMounted) {
              dispatch({
                type: 'error',
                payload: e instanceof Error ? e.message : 'Error desconocido',
              });
            }

            // Fallback: mostrar el texto si hay error
            const currentCanvas = canvasRef.current;
            if (!currentCanvas) return;
            currentCanvas.width = 200;
            currentCanvas.height = 50;
            const currentContext = currentCanvas.getContext('2d');
            if (currentContext) {
              currentContext.fillStyle = '#000';
              currentContext.font = '12px Arial';
              currentContext.textAlign = 'center';
              currentContext.fillText(
                `Error: ${number}`,
                currentCanvas.width / 2,
                currentCanvas.height / 2,
              );
            }
          });
      }
    };

    generateBarcode();

    return () => {
      isMounted = false;
    };
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
            color: '#f00',
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
