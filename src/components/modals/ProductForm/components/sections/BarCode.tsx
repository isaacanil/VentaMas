import {
  CalculatorOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  PrinterOutlined,
} from '@/constants/icons/antd';
import { Button, Card, Form, Input, Tooltip } from 'antd';
import { memo } from 'react';
import Barcode from 'react-barcode';
import styled from 'styled-components';

import BarcodePrintModal from '@/modules/dev/pages/test/pages/barcodePrint/components/BarcodePrintModal';
import type { ProductRecord } from '@/types/products';
import { BarcodeGenerator } from './BarcodeGenerator/BarcodeGenerator';
import BarcodeFixTooltip from './BarcodeGenerator/components/BarcodeFixTooltip';
import { BarcodeInfoModal } from './BarcodeInfoModal/BarcodeInfoModal';
import BarcodePreviewModal from './BarcodeInfoModal/BarcodePreviewModal';
import { useBarCodeController } from './BarCode/hooks/useBarCodeController';

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
  height: 100%;
`;

interface BarcodeContainerProps {
  $valid?: boolean;
}

interface BarcodeQuietZoneProps {
  $quietZone?: number;
}

interface ValidationMessageProps {
  $isValid?: boolean;
}

const BarcodeContainer = styled.div<BarcodeContainerProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  padding: 16px;
  margin-bottom: 16px;
  background-color: white;
  border: 2px solid
    ${(props: BarcodeContainerProps) =>
      props.$valid ? '#d9d9d9' : '#ff7875'};
  border-radius: 8px;
  height: 180px;
`;

const StyledCard = styled(Card)`
  height: 100%;
  display: flex;
  flex-direction: column;

  .ant-card-body {
    flex: 1;
    display: flex;
    flex-direction: column;
  }
`;

const BarcodeQuietZoneContainer = styled.div<BarcodeQuietZoneProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${(props: BarcodeQuietZoneProps) => props.$quietZone || 0}mm;
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

const ValidationMessage = styled.div<ValidationMessageProps>`
  display: flex;
  gap: 4px;
  align-items: center;
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.3;
  color: ${(props: ValidationMessageProps) =>
    props.$isValid ? '#52c41a' : '#ff4d4f'};
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

type BarCodeProps = {
  product: ProductRecord;
};

const BarCodeComponent = ({ product }: BarCodeProps) => {
  const {
    barcodeInfo,
    barcodeInputRef,
    barcodeRenderProps,
    barcodeStyle,
    correction,
    effectiveBarcodeValue,
    handleBarcodeChange,
    handleBarcodeInputBlur,
    handleBarcodeInputKeyDown,
    handleCorrectedCode,
    handleGeneratedCode,
    inputHasFocus,
    isConfigured,
    overallValidation,
    productBarcode,
    setBarcodeValue,
    setInputHasFocus,
    setIsFixTooltipDismissed,
    setShowGenerator,
    setShowInfoModal,
    setShowPreviewModal,
    setShowPrintModal,
    showFixTooltip,
    showGenerator,
    showInfoModal,
    showPreviewModal,
    showPrintModal,
    user,
    validationIcon,
    validationInfo,
  } = useBarCodeController(product);

  const renderedValidationIcon =
    validationIcon === 'valid' ? (
      <CheckCircleOutlined style={{ color: '#52c41a' }} />
    ) : validationIcon === 'invalid' ? (
      <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
    ) : null;
  const renderedInputSuffix = renderedValidationIcon ?? <span />;

  return (
    <>
      <StyledCard
        title={
          <HeaderContainer>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              Código de Barra
              {renderedValidationIcon}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {effectiveBarcodeValue && barcodeInfo ? (
                <Tooltip title="Click para ver información detallada">
                  <Button
                    type="text"
                    size="small"
                    onClick={() => setShowInfoModal(true)}
                  >
                    Información
                  </Button>
                </Tooltip>
              ) : null}
            </div>
          </HeaderContainer>
        }
        size="small"
      >
        <ContentContainer>
          <BarcodeContainer {...barcodeStyle}>
            <BarcodeQuietZoneContainer $quietZone={barcodeRenderProps.quietZone}>
              <Barcode
                width={barcodeRenderProps.width}
                height={barcodeRenderProps.height}
                value={effectiveBarcodeValue || '-'}
                fontSize={barcodeRenderProps.fontSize}
                margin={barcodeRenderProps.margin}
                background={barcodeRenderProps.background}
              />
            </BarcodeQuietZoneContainer>
          </BarcodeContainer>

          <FormItemContainer>
            <Form.Item
              label="Código de barras"
              validateStatus={
                overallValidation.status === 'error'
                  ? 'error'
                  : overallValidation.status === 'warning'
                    ? 'warning'
                    : ''
              }
              help={
                overallValidation.status !== 'success'
                  ? overallValidation.message
                  : undefined
              }
            >
              <InputWrapper>
                <Input
                  ref={barcodeInputRef}
                  value={effectiveBarcodeValue}
                  onChange={handleBarcodeChange}
                  placeholder="Ingresa el código de barras"
                  suffix={renderedInputSuffix}
                  onKeyDown={handleBarcodeInputKeyDown}
                  onPressEnter={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onFocus={() => {
                    setBarcodeValue(productBarcode);
                    setInputHasFocus(true);
                  }}
                  onBlur={handleBarcodeInputBlur}
                  maxLength={18}
                />

                {validationInfo && !validationInfo.isValid && effectiveBarcodeValue ? (
                  <ValidationMessage $isValid={false}>
                    <ExclamationCircleOutlined />
                    {validationInfo.message}
                  </ValidationMessage>
                ) : null}
                {validationInfo && validationInfo.isValid && effectiveBarcodeValue ? (
                  <ValidationMessage $isValid={true}>
                    <CheckCircleOutlined />
                    {validationInfo.message}
                  </ValidationMessage>
                ) : null}

                <BarcodeFixTooltip
                  visible={Boolean(
                    correction && showFixTooltip && inputHasFocus,
                  )}
                  currentCode={effectiveBarcodeValue}
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
              disabled={
                !effectiveBarcodeValue || !String(effectiveBarcodeValue).trim()
              }
            >
              Imprimir
            </FooterButton>
            <FooterButton
              type="text"
              icon={<CalculatorOutlined />}
              onClick={() => setShowGenerator(true)}
              disabled={!user?.businessID}
            >
              {product?.barcode ? 'Generar' : isConfigured ? 'Generar' : 'Configurar'}
            </FooterButton>
          </FooterContainer>
        </ContentContainer>
      </StyledCard>

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
          number: product?.barcode || effectiveBarcodeValue || '',
        }}
      />

      <BarcodeInfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        barcodeValue={effectiveBarcodeValue}
      />

      <BarcodePreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
      />
    </>
  );
};

const areBarCodePropsEqual = (prev: BarCodeProps, next: BarCodeProps) => {
  return (
    prev.product?.id === next.product?.id &&
    prev.product?.barcode === next.product?.barcode
  );
};

export const BarCode = memo(BarCodeComponent, areBarCodePropsEqual);
