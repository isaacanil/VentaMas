import { Modal, Select, Form, Spin, Alert } from 'antd';
import React, { useState, useLayoutEffect, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useReactToPrint } from 'react-to-print';
import styled from 'styled-components';

import BarcodeItem from './BarcodeItem';
import QuantitySelector from './QuantitySelector';

type BarcodeType = 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'qrcode';

interface BarcodeTypeOption {
  value: BarcodeType;
  label: string;
}

interface SelectedBarcode {
  name?: string | null;
  number: string | number;
}

interface PrintBarcodeItem extends SelectedBarcode {
  id: string;
  barcodeType: BarcodeType;
}

interface BarcodePrintModalProps {
  show: boolean;
  onClose: () => void;
  selectedBarcode?: SelectedBarcode | null;
}

const BarcodeGrid = styled.div`
  /* Pantalla: 1 columna (sin columnas visuales) */
  display: grid;
  grid-template-columns: 1fr;
  gap: 8px;
  justify-items: center;
  width: 100%;
  padding: 10px;
  margin: 0;

  @media print {
    /* Impresión: nada de grid/flex para que respeten los saltos */
    display: block !important;
    padding: 5px;
    margin: 0;
    break-inside: avoid;

    & > .barcode-item {
      margin-bottom: 7mm;
    }

    & > .barcode-item:last-child {
      margin-bottom: 0;
    }
  }
`;

/** Portal para montar el contenido de impresión fuera del Modal */
const PrintPortal = ({ children }: { children: React.ReactNode }) => {
  const [containerEl] = useState<HTMLDivElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.id = 'barcode-print-root';
    el.style.position = 'absolute';
    el.style.top = '-9999px';
    el.style.left = '-9999px';
    return el;
  });

  useEffect(() => {
    if (!containerEl || typeof document === 'undefined') return undefined;
    document.body.appendChild(containerEl);
    return () => {
      document.body.removeChild(containerEl);
    };
  }, [containerEl]);

  if (!containerEl) return null;
  return createPortal(children, containerEl);
};

const clampInt = (n: number, min: number, max: number) => {
  const x = Number.isFinite(n) ? Math.floor(n) : min;
  return Math.max(min, Math.min(max, x));
};

const BarcodePrintModal = ({ show, onClose, selectedBarcode }: BarcodePrintModalProps) => {
  // Número de páginas a imprimir; cada página contiene 4 códigos
  const [pagesCount, setPagesCount] = useState(1);
  const [barcodeType, setBarcodeType] = useState<BarcodeType>('code128');
  const [isLoading, setIsLoading] = useState(false);
  const [printBarcodes, setPrintBarcodes] = useState<PrintBarcodeItem[]>([]);

  const printRef = useRef<HTMLDivElement | null>(null);

  const barcodeTypes: BarcodeTypeOption[] = [
    { value: 'code128', label: 'Code 128' },
    { value: 'code39', label: 'Code 39' },
    { value: 'ean13', label: 'EAN-13' },
    { value: 'ean8', label: 'EAN-8' },
    { value: 'upca', label: 'UPC-A' },
  ];

  const handleAfterPrint = () => {
    setPrintBarcodes([]);
    setPagesCount(1);
    setBarcodeType('code128');
    onClose();
  };

  const pageStyle = `@page {  size: 312px 502px; margin: 0; }
@media print {
  html, body { height: initial !important; overflow: initial !important; margin: 0 !important; padding: 0 !important; }

   .print-page { 
    break-after: page; 
    page-break-after: always; 
    display: flex;
     flex-direction: column; /* Eje principal vertical para poder empujar hacia abajo */
     align-items: center; /* Centra horizontalmente */
     justify-content: center; /* Alinea el contenido al fondo de la página */
    box-sizing: border-box;
      width: 312px;
      height: 502px; /* Tamaño fijo del documento (alto) */
      min-height: 502px;
  }
 .print-page:last-child { 
    break-after: auto; 
    page-break-after: auto; 
  }
  .barcode-grid { 
    display: flex !important; 
    flex-direction: column !important;
    align-items: center !important;
    justify-content: flex-end !important; /* Alineado desde abajo */
    margin: 0 !important; 
    padding: 0 !important; 
    width: 100%;
    height: auto; /* Dejar que tome la altura de su contenido para que la página lo empuje abajo */
  }
  .barcode-item { break-inside: avoid !important; page-break-inside: avoid !important; }
  
}`;

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    pageStyle,
    onAfterPrint: handleAfterPrint,
  });

  useLayoutEffect(() => {
    if (printBarcodes.length > 0) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          setIsLoading(false);
          handlePrint();
        }, 200);
      });
    }
  }, [handlePrint, printBarcodes]);

  const handleOk = () => {
    if (!selectedBarcode) return;
    setIsLoading(true);
    // Cada página imprime 4 códigos; el usuario controla páginas, no cantidad directa
    const safePages = clampInt(pagesCount, 1, 100);
    const qty = safePages * 4;
    const generated: PrintBarcodeItem[] = Array.from({ length: qty }, (_, i) => ({
      ...selectedBarcode,
      id: `${selectedBarcode.number}-${i + 1}`,
      barcodeType,
    }));
    setPrintBarcodes(generated);
  };

  const handleCancel = () => {
    if (isLoading) return;
    onClose();
  };

  const divideBarcodesByPages = (codes: PrintBarcodeItem[]) => {
    const perPage = 4; // fijo: 4 códigos por página
    const pages: PrintBarcodeItem[][] = [];
    for (let i = 0; i < codes.length; i += perPage) {
      pages.push(codes.slice(i, i + perPage));
    }
    return pages;
  };

  const pages = divideBarcodesByPages(printBarcodes);

  return (
    <>
      <Modal
        open={show}
        title="Configurar e imprimir códigos de barras"
        okText="Imprimir"
        cancelText="Cancelar"
        onOk={handleOk}
        onCancel={handleCancel}
        confirmLoading={isLoading}
        maskClosable={false}
        centered
      >
        <Spin spinning={isLoading} tip="Preparando impresión...">
          {selectedBarcode && (
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message={
                <div>
                  <strong>Producto:</strong>{' '}
                  {selectedBarcode.name || 'Sin nombre'}
                </div>
              }
              description={
                <div>
                  <strong>Código:</strong> {selectedBarcode.number}
                </div>
              }
            />
          )}

          {/* Configuración */}
          <Form layout="vertical">
            <Form.Item label="Páginas (4 códigos por página)">
              <QuantitySelector
                quantity={pagesCount}
                onChange={setPagesCount}
                max={100}
                disabled={isLoading}
              />
            </Form.Item>

            <Form.Item label="Tipo de código">
              <Select
                value={barcodeType}
                onChange={setBarcodeType}
                options={barcodeTypes}
                disabled={isLoading}
              />
            </Form.Item>
          </Form>

          {/* Vista previa cuando aún no hay lista */}
          {printBarcodes.length === 0 && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <h4>Vista previa</h4>
              <BarcodeItem
                name={selectedBarcode?.name}
                number={selectedBarcode?.number}
                barcodeType={barcodeType}
              />
            </div>
          )}
        </Spin>
      </Modal>

      {/* Contenido REAL a imprimir (fuera del modal) */}
      <PrintPortal>
        <div ref={printRef} id="print-section">
          {pages.map((pageItems, pageIndex) => (
            <section key={`page-${pageIndex}`} className="print-page">
              <BarcodeGrid className="barcode-grid">
                {pageItems.map((barcode) => (
                  <div className="barcode-item" key={barcode.id}>
                    <BarcodeItem
                      name={barcode.name}
                      number={String(barcode.number)}
                      barcodeType={barcode.barcodeType}
                    />
                  </div>
                ))}
              </BarcodeGrid>
            </section>
          ))}
        </div>
      </PrintPortal>
    </>
  );
};

export default BarcodePrintModal;

