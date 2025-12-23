import {
  CalculatorOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
} from '@ant-design/icons';
import { Card, Input, Form, Button, Tooltip, message } from 'antd';
import { useMemo, useState } from 'react';
import Barcode from 'react-barcode';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { ChangeProductData } from '@/features/updateProduct/updateProductSlice';
import useBarcodeSettings from '@/hooks/barcode/useBarcodeSettings';
import {
  getBarcodeInfo,
  PRINT_DPI,
  getGS1Geometry,
} from '@/utils/barcode/barcode';
import BarcodePrintModal from '@/views/pages/test/pages/barcodePrint/components/BarcodePrintModal';

import { BarcodeGenerator } from './BarcodeGenerator/BarcodeGenerator';
import BarcodeFixTooltip from './BarcodeGenerator/components/BarcodeFixTooltip';
import { BarcodeInfoModal } from './BarcodeInfoModal/BarcodeInfoModal';
import BarcodePreviewModal from './BarcodeInfoModal/BarcodePreviewModal';

// Calcular dimensiones GS1 usando util
const getGs1GeometryForType = (barcodeType) =>
  getGS1Geometry(PRINT_DPI, barcodeType);

const HeaderContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

const ContentContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
`;

const BarcodeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  background-color: white;
  border: 2px solid ${(props) => (props.valid ? '#d9d9d9' : '#ff7875')};
  border-radius: 8px;
`;

const BarcodeQuietZoneContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props) => props.quietZone || 0}mm;
  background-color: white;
`;

const FormItemContainer = styled.div`
  width: 100%;
  margin-bottom: 16px;
`;

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`;

const ValidationMessage = styled.div`
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.3;
  color: ${(props) => (props.isValid ? '#52c41a' : '#ff4d4f')};
`;

const FooterContainer = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
  width: 100%;
`;

const FooterButton = styled(Button)`
  flex: 1;
`;

export const BarCode = ({ product }) => {
  const [showGenerator, setShowGenerator] = useState(false);
  const [inputHasFocus, setInputHasFocus] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isFixTooltipDismissed, setIsFixTooltipDismissed] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState(
    String(product?.barcode || ''),
  );

  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const { isConfigured } = useBarcodeSettings();

  const barcodeInfo = barcodeValue ? getBarcodeInfo(barcodeValue) : null;

  // Calcular dimensiones GS1 precisas para preview
  const getBarcodeRenderProps = useMemo(() => {
    const geometry = getGs1GeometryForType(barcodeInfo?.type);

    return {
      width: (geometry.xPx / PRINT_DPI) * 96, // bar width in screen px
      height: Math.max((geometry.heightPx / PRINT_DPI) * 96, 35), // min for readability
      fontSize: 10,
      margin: 0,
      quietZone: geometry.quietZoneMm,
      background: 'white',
    };
  }, [barcodeInfo?.type]);

  // Validación de longitud
  const getValidationInfo = () => {
    if (!barcodeValue || !barcodeInfo?.type) return null;

    const geometry = getGs1GeometryForType(barcodeInfo.type);
    const length = barcodeValue.length;

    if (geometry.exactLength) {
      const ok = length === geometry.exactLength;
      return {
        isValid: ok,
        expected: geometry.exactLength,
        message: ok
          ? 'Longitud correcta (' + length + ' digitos)'
          : 'Requiere exactamente ' +
            geometry.exactLength +
            ' digitos (actual: ' +
            length +
            ')',
      };
    }

    if (geometry.maxLength) {
      const ok = length <= geometry.maxLength;
      return {
        isValid: ok,
        expected: '<=' + geometry.maxLength,
        message: ok
          ? 'Longitud valida (' +
            length +
            '/' +
            geometry.maxLength +
            ' digitos)'
          : 'Excede maximo ' +
            geometry.maxLength +
            ' digitos (actual: ' +
            length +
            ')',
      };
    }

    return null;
  };

  const validationInfo = getValidationInfo();

  const isValidLength = () => validationInfo?.isValid ?? true;

  // Función para validación de longitud
  const getOverallValidation = () => {
    const lengthValid = isValidLength();

    if (!lengthValid) {
      return { status: 'error', message: validationInfo?.message };
    }

    return { status: 'success', message: null };
  };

  const handleGeneratedCode = (code) => {
    dispatch(
      ChangeProductData({
        product: { barcode: code },
      }),
    );
    setIsFixTooltipDismissed(false);
  };

  const handleCorrectedCode = (code) => {
    setBarcodeValue(code);
    dispatch(ChangeProductData({ product: { barcode: code } }));
    setIsFixTooltipDismissed(true);
    message.success('Código corregido aplicado');
  };

  const handleBarcodeChange = (e) => {
    const val = e.target.value;
    setBarcodeValue(val);
    dispatch(ChangeProductData({ product: { barcode: val } }));
    setIsFixTooltipDismissed(false);
  };

  const getValidationIcon = () => {
    if (!barcodeValue) return null;

    return barcodeInfo?.valid ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : (
      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    );
  };

  const getBarcodeStyle = () => {
    if (!barcodeValue) return { valid: true };
    return { valid: barcodeInfo?.valid || false };
  };

  const correction = useMemo(() => {
    if (!barcodeValue || barcodeInfo?.valid) return null;

    // Reconocer tipos de barcode según la longitud
    const getExpectedLengthByType = (length) => {
      switch (length) {
        case 7:
          return { type: 'EAN-8', expectedLength: 8 }; // EAN-8 sin check digit
        case 12:
          return { type: 'EAN-13', expectedLength: 13 }; // EAN-13 sin check digit
        case 11:
          return { type: 'UPC-A', expectedLength: 12 }; // UPC-A sin check digit
        case 17:
          return { type: 'ITF-14', expectedLength: 18 }; // ITF-14 sin check digit
        default:
          return null;
      }
    };

    const currentLength = barcodeValue.length;
    const expectedType = getExpectedLengthByType(currentLength);

    // Solo sugerir si falta exactamente 1 dígito para completar
    if (expectedType && currentLength === expectedType.expectedLength - 1) {
      // Calcular check digit según el tipo
      const calculateCheckDigit = (code, type) => {
        if (type === 'EAN-8' || type === 'EAN-13' || type === 'UPC-A') {
          // Algoritmo EAN/UPC
          let sum = 0;
          for (let i = 0; i < code.length; i++) {
            const digit = parseInt(code[i]);
            if (i % 2 === 0) {
              sum += digit;
            } else {
              sum += digit * 3;
            }
          }
          return (10 - (sum % 10)) % 10;
        } else if (type === 'ITF-14') {
          // Algoritmo ITF-14 (similar a EAN)
          let sum = 0;
          for (let i = 0; i < code.length; i++) {
            const digit = parseInt(code[i]);
            if (i % 2 === 0) {
              sum += digit * 3;
            } else {
              sum += digit;
            }
          }
          return (10 - (sum % 10)) % 10;
        }
        return 0;
      };

      const checkDigit = calculateCheckDigit(barcodeValue, expectedType.type);
      const completeCode = barcodeValue + checkDigit;

      return {
        fixed: completeCode,
        reason: `Completar ${expectedType.type} con dígito verificador: ${checkDigit}`,
        type: 'complete',
      };
    }

    // Verificar si ya tiene la longitud correcta pero el check digit es incorrecto
    if (
      barcodeInfo?.checkDigit &&
      !barcodeInfo.checkDigit.isValid &&
      barcodeInfo.checkDigit.correctDigit !== undefined
    ) {
      return {
        fixed:
          barcodeValue.slice(0, -1) +
          String(barcodeInfo.checkDigit.correctDigit),
        reason: `Dígito verificador incorrecto: ${barcodeValue.slice(-1)} → ${barcodeInfo.checkDigit.correctDigit}`,
        type: 'checkdigit',
      };
    }

    return null;
  }, [barcodeInfo, barcodeValue]);

  const showFixTooltip = inputHasFocus && !!correction && !isFixTooltipDismissed;

  return (
    <>
      <Card
        title={
          <HeaderContainer>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Código de Barra
              {getValidationIcon()}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {barcodeValue && barcodeInfo && (
                <Tooltip
                  title="Click para ver información detallada"
                  onClick={() => setShowInfoModal(true)}
                >
                  <Button type="text" size="small">
                    Información
                  </Button>
                </Tooltip>
              )}
            </div>
          </HeaderContainer>
        }
        size="small"
      >
        <ContentContainer>
          <BarcodeContainer {...getBarcodeStyle()}>
            <BarcodeQuietZoneContainer
              quietZone={getBarcodeRenderProps.quietZone}
            >
              <Barcode
                width={getBarcodeRenderProps.width}
                height={getBarcodeRenderProps.height}
                value={barcodeValue || '-'}
                fontSize={getBarcodeRenderProps.fontSize}
                margin={getBarcodeRenderProps.margin}
                background={getBarcodeRenderProps.background}
              />
            </BarcodeQuietZoneContainer>
          </BarcodeContainer>

          <FormItemContainer>
            <Form.Item
              label="Código de barras"
              validateStatus={
                getOverallValidation().status === 'error'
                  ? 'error'
                  : getOverallValidation().status === 'warning'
                    ? 'warning'
                    : ''
              }
              help={
                getOverallValidation().status !== 'success'
                  ? getOverallValidation().message
                  : undefined
              }
            >
              <InputWrapper>
                <Input
                  value={barcodeValue}
                  onChange={handleBarcodeChange}
                  placeholder="Ingresa el código de barras"
                  suffix={getValidationIcon()}
                  onFocus={() => setInputHasFocus(true)}
                  onBlur={() => setInputHasFocus(false)}
                  maxLength={18}
                />

                {/* Mensaje de validación de longitud */}
                {validationInfo && !validationInfo.isValid && barcodeValue && (
                  <ValidationMessage isValid={false}>
                    <ExclamationCircleOutlined />
                    {validationInfo.message}
                  </ValidationMessage>
                )}
                {validationInfo && validationInfo.isValid && barcodeValue && (
                  <ValidationMessage isValid={true}>
                    <CheckCircleOutlined />
                    {validationInfo.message}
                  </ValidationMessage>
                )}

                <BarcodeFixTooltip
                  visible={Boolean(
                    correction && showFixTooltip && inputHasFocus,
                  )}
                  currentCode={barcodeValue}
                  suggestion={correction}
                  onApply={(code) => handleCorrectedCode(code)}
                  onClose={() => setIsFixTooltipDismissed(true)}
                  placement="center"
                />
              </InputWrapper>
            </Form.Item>
          </FormItemContainer>
          <FooterContainer>
            <FooterButton
              type="text"
              icon={<PrinterOutlined />}
              onClick={() => setShowPrintModal(true)}
              disabled={!barcodeValue || !String(barcodeValue).trim()}
            >
              Imprimir
            </FooterButton>
            <FooterButton
              type="text"
              icon={<CalculatorOutlined />}
              onClick={() => setShowGenerator(true)}
              disabled={!user?.businessID}
            >
              {product?.barcode
                ? 'Generar'
                : isConfigured
                  ? 'Generar'
                  : 'Configurar'}
            </FooterButton>
          </FooterContainer>
        </ContentContainer>
      </Card>

      <BarcodeGenerator
        visible={showGenerator}
        onClose={() => setShowGenerator(false)}
        onGenerate={handleGeneratedCode}
        currentBarcode={product?.barcode}
      />

      <BarcodePrintModal
        show={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        selectedBarcode={{
          name: product?.productName || product?.name || 'Producto',
          number: product?.barcode || barcodeValue || '',
        }}
      />

      <BarcodeInfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        barcodeValue={barcodeValue}
        barcodeInfo={barcodeInfo}
      />

      <BarcodePreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </>
  );
};
