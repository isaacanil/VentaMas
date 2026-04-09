import { Modal, InputNumber, Select, Checkbox, message } from 'antd';
import { useMemo, useRef, useState } from 'react';
import Barcode from 'react-barcode';
import { useReactToPrint } from 'react-to-print';
import styled, { createGlobalStyle } from 'styled-components';

import type { BarcodeInfo } from '@/utils/barcode/barcode';
import type { ProductRecord } from '@/types/products';

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

const mmToPx = (mm: number) => Math.max(1, Math.round((mm / 25.4) * DPI));
const mmToIn = (mm: number) => mm / 25.4;

const GlobalPrintStyle = createGlobalStyle``;

type LabelProps = {
  width: number;
  height: number;
  margin: number;
};

const Label = styled.div<LabelProps>`
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

type ProdNameProps = {
  fontSize: number;
};

const ProdName = styled.div<ProdNameProps>`
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

type QuietProps = {
  qmm: number;
};

const Quiet = styled.div<QuietProps>`
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

type LabelProfile = 'standard' | 'variable';

type LabelConfig = {
  isVariable: boolean;
  HEIGHT_FACTOR: number;
  X_MM: number;
  H_MM: number;
  QUIET_MULT: number;
  LABEL_WIDTH_MM: number;
  LABEL_HEIGHT_MM: number;
  MARGIN_MM: number;
  FONT_SIZE_PT: number;
  BARCODE_FONT_SIZE: number;
  NAME_MAX_LEN: number;
};

type BarcodePrintModalProps = {
  visible: boolean;
  onClose: () => void;
  barcodeValue?: string | null;
  barcodeInfo?: BarcodeInfo | null;
  product?: ProductRecord | null;
};

export const BarcodePrintModal = ({
  visible,
  onClose,
  barcodeValue,
  barcodeInfo,
  product,
}: BarcodePrintModalProps) => {
  const [qty, setQty] = useState(1);
  const [labelProfile, setLabelProfile] = useState<LabelProfile>('standard');
  const [isNameVisible, setIsNameVisible] = useState(true);
  const printRef = useRef<HTMLDivElement | null>(null);

  const config = useMemo<LabelConfig>(() => {
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

  const xPx = useMemo(() => {
    if (!visible) return 2;
    const quietZoneMm = config.X_MM * config.QUIET_MULT * 2;
    const availableMm =
      config.LABEL_WIDTH_MM - config.MARGIN_MM * 2 - quietZoneMm;
    const availablePx = mmToPx(availableMm);
    const digits = barcodeValue?.length || 0;
    const totalModules = digits * 7 + 11;
    const theoretical =
      totalModules > 0 ? Math.floor(availablePx / totalModules) : 2;
    const nominal = mmToPx(config.X_MM);
    return Math.max(1, Math.min(nominal, theoretical));
  }, [visible, config, barcodeValue]);

  const validate = () => {
    const code = String(barcodeValue ?? '').trim();
    if (!code) return 'Ingresa un código de barras';

    const expectedLengthByType: Record<string, number> = {
      'EAN-13': 13,
      'GTIN-13': 13,
      'UPC-A': 12,
      'EAN-8': 8,
      'GTIN-14': 14,
    };

    const need = barcodeInfo?.type
      ? (expectedLengthByType[barcodeInfo.type] ?? null)
      : null;
    if (need && code.length !== need) return `Debe tener ${need} dígitos`;
    return null;
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Etiqueta-${barcodeValue || 'Sin-Codigo'}`,
    onAfterPrint: () => {
      setQty(1);
      onClose();
    },
    onPrintError: (err) => {
      const hasMessage = (value: unknown): value is { message?: unknown } =>
        typeof value === 'object' && value !== null && 'message' in value;
      const messageText = hasMessage(err)
        ? String(err.message)
        : String(err ?? 'Error desconocido');
      message.error('Error al imprimir: ' + messageText);
    },
  });

  const handleOk = () => {
    const err = validate();
    if (err) return message.error(err);
    handlePrint();
  };

  const name = useMemo(() => {
    const rawCandidate = product?.name ?? product?.productName ?? product?.title;
    const raw =
      typeof rawCandidate === 'string' && rawCandidate.trim()
        ? rawCandidate
        : 'Producto';
    return raw.length > config.NAME_MAX_LEN
      ? raw.slice(0, config.NAME_MAX_LEN - 3) + '...'
      : raw;
  }, [product, config.NAME_MAX_LEN]);

  const heightPx = Math.round(mmToPx(config.H_MM) * config.HEIGHT_FACTOR);
  const quietMm = config.X_MM * config.QUIET_MULT;
  const safeBarcodeValue = String(barcodeValue ?? '');
  const labels = Array.from({ length: qty }, (_, offset) => offset + 1).map(
    (copyNumber) => (
      <Label
        key={`${safeBarcodeValue}-${labelProfile}-${copyNumber}`}
        width={config.LABEL_WIDTH_MM}
        height={config.LABEL_HEIGHT_MM}
        margin={config.MARGIN_MM}
      >
        {isNameVisible && (
          <ProdName fontSize={config.FONT_SIZE_PT}>{name}</ProdName>
        )}
        <Quiet qmm={quietMm}>
          <Barcode
            value={safeBarcodeValue}
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
    ),
  );

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
            onChange={(value) => setQty(Number(value ?? 1))}
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
            {labels}
          </div>
        </PreviewContainer>
      </Modal>
      {visible && (
        <div style={{ position: 'absolute', left: -9999 }}>
          <div ref={printRef}>{labels}</div>
        </div>
      )}
    </>
  );
};
