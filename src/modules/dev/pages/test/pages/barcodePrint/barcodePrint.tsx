import { useState } from 'react';

import BarcodePrintModal from './components/BarcodePrintModal';
// eliminado ReactToPrint, la lógica de impresión vive en el modal

const BarcodePrintPage = () => {
  const [showPrintModal, setShowPrintModal] = useState(false);
  // La lógica de impresión se maneja ahora dentro del modal

  // Eliminadas refs de impresión; se manejan en el modal

  // Simular código de barras que recibe el componente
  const mockBarcode = {
    name: 'Producto de Prueba',
    number: '123456789012',
  };

  // useLayoutEffect removido; la impresión se gestiona en el modal

  // handleAfterPrint ahora gestionado en el modal

  const handlePrintClick = () => {
    setShowPrintModal(true);
  };

  // handlePrint trasladado al modal

  const handleCancelPrint = () => {
    setShowPrintModal(false);
  };

  return (
    <div>
      {/* Interfaz simple con botón de imprimir */}
      <div className="no-print">
        <div className="interface">
          <div className="mock-info">
            <strong>Código simulado:</strong> {mockBarcode.name} -{' '}
            {mockBarcode.number}
          </div>
          <button onClick={handlePrintClick} className="print-button">
            🖨️ Imprimir Códigos de Barras 2
          </button>
        </div>
      </div>

      {/* Modal de configuración de impresión */}
      <BarcodePrintModal
        show={showPrintModal}
        onClose={handleCancelPrint}
        selectedBarcode={mockBarcode}
      />
    </div>
  );
};

export default BarcodePrintPage;
