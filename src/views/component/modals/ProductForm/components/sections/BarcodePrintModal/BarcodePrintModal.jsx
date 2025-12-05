import * as ant from 'antd';
import { useState, useRef, useLayoutEffect, useMemo } from 'react';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import styled, { createGlobalStyle } from 'styled-components';

const { Modal, InputNumber, Select, Checkbox } = ant;

const STD_CONFIG = {
  HEIGHT_FACTOR: 0.4,
  X_MM: 0.25,
  H_MM: 15,
  QUIET_MULT: 9,
  LABEL_WIDTH_MM: 40,
  LABEL_HEIGHT_MM: 30,
  MARGIN_MM: 1.5,
  FONT_SIZE_PT: 6,
  BARCODE_FONT_SIZE: 10,
  NAME_MAX_LEN: 18,
};

const VAR_CONFIG = {
  MIN_WIDTH_MM: 22,
  MAX_WIDTH_MM: 30.48,
  HEIGHT_WITH_NAME_MM: 25.4,
  HEIGHT_NO_NAME_MM: 12.7,
  MARGIN_MM: 1.5,
  FONT_SIZE_PT: 5,
  BARCODE_FONT_SIZE: 9,
  NAME_MAX_LEN: 15,
};

const DPI = 203;

const mmToPx = (mm) => Math.max(1, Math.round((mm / 25.4) * DPI));
const mmToIn = (mm) => mm / 25.4;

const GlobalPrintStyle = createGlobalStyle`
`;

const Label = styled.div`
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: ${(p) => p.width}mm;
  height: ${(p) => p.height}mm;
  padding: ${(p) => p.margin}mm;
  margin: 0 auto;
  text-align: center;
  background: #fff;
  border: 1px dashed #ccc;

  @media print {
    border: none;
    break-after: always;
  }
`;

const ProdName = styled.div`
  width: 100%;
  max-height: 6mm;
  margin-bottom: 0.5mm;
  overflow: hidden;
  text-overflow: ellipsis;
  font:
    600 ${(p) => p.fontSize}pt / 1 Arial,
    sans-serif;
  text-transform: uppercase;
  white-space: nowrap;
`;

const Quiet = styled.div`
  display: flex;
  flex-grow: 1;
  align-items: center;
  justify-content: center;
  padding: 0 ${(p) => mmToIn(p.qmm)}in;
`;

const PreviewContainer = styled.div`
  max-height: 300px;
  padding: 8px;
  margin-top: 12px;
  overflow-y: auto;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;

  @media print {
    display: none;
  }
`;

export const BarcodePrintModal = ({
  visible,
  onClose,
  barcodeValue,
  barcodeInfo,
  product,
}) => {
  const [qty, setQty] = useState(1);
  const [labelProfile, setLabelProfile] = useState('standard');
  const [isNameVisible, setIsNameVisible] = useState(true);
  const printRef = useRef(null);
  const [xPx, setXPx] = useState(2);

  const config = useMemo(() => {
    if (labelProfile === 'variable') {
      const digits = barcodeValue?.length || 12;
      const totalModules = digits * 7 + 11;
      const desiredWidthMm = Math.min(
        VAR_CONFIG.MAX_WIDTH_MM,
        Math.max(VAR_CONFIG.MIN_WIDTH_MM, totalModules * STD_CONFIG.X_MM),
      );
      return {
        isVariable: true,
        HEIGHT_FACTOR: 0.5,
        X_MM: STD_CONFIG.X_MM,
        H_MM: isNameVisible
          ? VAR_CONFIG.HEIGHT_WITH_NAME_MM * 0.4
          : VAR_CONFIG.HEIGHT_NO_NAME_MM * 0.7,
        QUIET_MULT: 9,
        LABEL_WIDTH_MM: desiredWidthMm,
        LABEL_HEIGHT_MM: isNameVisible
          ? VAR_CONFIG.HEIGHT_WITH_NAME_MM
          : VAR_CONFIG.HEIGHT_NO_NAME_MM,
        MARGIN_MM: VAR_CONFIG.MARGIN_MM,
        FONT_SIZE_PT: VAR_CONFIG.FONT_SIZE_PT,
        BARCODE_FONT_SIZE: VAR_CONFIG.BARCODE_FONT_SIZE,
        NAME_MAX_LEN: VAR_CONFIG.NAME_MAX_LEN,
      };
    }
    return { isVariable: false, ...STD_CONFIG };
  }, [labelProfile, isNameVisible, barcodeValue]);

  useLayoutEffect(() => {
    if (!visible) return;
    const quietZoneMm = config.X_MM * config.QUIET_MULT * 2;
    const availableMm =
      config.LABEL_WIDTH_MM - config.MARGIN_MM * 2 - quietZoneMm;
    const availablePx = mmToPx(availableMm);
    const digits = barcodeValue?.length || 0;
    const totalModules = digits * 7 + 11;
    const theoretical =
      totalModules > 0 ? Math.floor(availablePx / totalModules) : 2;
    const nominal = mmToPx(config.X_MM);
    setXPx(Math.max(1, Math.min(nominal, theoretical)));
  }, [visible, config, barcodeValue]);

  const validate = () => {
    if (!barcodeValue) return 'Código vacío';
    const need = { 'UPC-A': 12, 'EAN-13': 13, 'EAN-8': 8, 'GTIN-14': 14 }[
      barcodeInfo?.type
    ];
    if (need && barcodeValue.length !== need)
      return `Debe tener ${need} dígitos`;
    return null;
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Etiqueta-${barcodeValue || 'Sin-Codigo'}`,
    onAfterPrint: () => {
      setQty(1);
      onClose();
    },
    onPrintError: (e) => ant.message.error('Error al imprimir: ' + e.message),
  });

  const handleOk = () => {
    const err = validate();
    if (err) return ant.message.error(err);
    handlePrint();
  };

  const name = useMemo(() => {
    const raw =
      product?.name || product?.productName || product?.title || 'Producto';
    return raw.length > config.NAME_MAX_LEN
      ? raw.slice(0, config.NAME_MAX_LEN - 3) + '...'
      : raw;
  }, [product, config.NAME_MAX_LEN]);

  const heightPx = Math.round(mmToPx(config.H_MM) * config.HEIGHT_FACTOR);
  const quietMm = config.X_MM * config.QUIET_MULT;

  const renderLabels = () =>
    Array.from({ length: qty }).map((_, i) => (
      <Label
        key={i}
        width={config.LABEL_WIDTH_MM}
        height={config.LABEL_HEIGHT_MM}
        margin={config.MARGIN_MM}
      >
        {isNameVisible && (
          <ProdName fontSize={config.FONT_SIZE_PT}>{name}</ProdName>
        )}
        <Quiet qmm={quietMm}>
          <Barcode
            value={barcodeValue}
            width={xPx}
            height={heightPx}
            margin={0}
            background="#fff"
            fontSize={config.BARCODE_FONT_SIZE}
            textAlign="center"
            textPosition="bottom"
          />
        </Quiet>
      </Label>
    ));

  return (
    <>
      <GlobalPrintStyle />
      <Modal
        title="Imprimir etiquetas – 2Connect 2C‑LP427B"
        open={visible}
        onCancel={onClose}
        onOk={handleOk}
        okText="Imprimir"
        cancelText="Cancelar"
        width={420}
        destroyOnHidden
      >
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Perfil de Etiqueta:
          </label>
          <Select
            value={labelProfile}
            onChange={setLabelProfile}
            style={{ width: '100%', marginBottom: 12 }}
            options={[
              { value: 'standard', label: 'Estándar (40×30 mm)' },
              { value: 'variable', label: 'Personalizado (Variable)' },
            ]}
          />
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
            Cantidad:
          </label>
          <InputNumber
            min={1}
            max={100}
            value={qty}
            onChange={setQty}
            style={{ width: '100%', marginBottom: 8 }}
          />
          {labelProfile === 'variable' && (
            <Checkbox
              checked={isNameVisible}
              onChange={(e) => setIsNameVisible(e.target.checked)}
              style={{ marginTop: 8, fontSize: 12 }}
            >
              Incluir nombre del producto
            </Checkbox>
          )}
          <div
            style={{
              fontSize: 12,
              color: '#666',
              lineHeight: 1.4,
              marginTop: 12,
            }}
          >
            <div>
              <strong>Dimensiones:</strong> {Math.round(config.LABEL_WIDTH_MM)}×
              {Math.round(config.LABEL_HEIGHT_MM)} mm &nbsp;|&nbsp;{' '}
              <strong>Resolución:</strong> {DPI} DPI
            </div>
            <div>
              <strong>Estimado por rollo (40×30):</strong> ≈ 3 100 etiquetas
            </div>
          </div>
        </div>

        <PreviewContainer>
          <div
            style={{
              fontSize: 11,
              color: '#888',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Vista previa (escala real)
          </div>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 4,
              justifyContent: 'center',
            }}
          >
            {renderLabels()}
          </div>
        </PreviewContainer>
      </Modal>
      {visible && (
        <div style={{ position: 'absolute', left: -9999 }}>
          <div ref={printRef}>{renderLabels()}</div>
        </div>
      )}
    </>
  );
};
