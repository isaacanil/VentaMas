import { InfoCircleOutlined } from '@/constants/icons/antd';
import { Modal, Button } from 'antd';
import Barcode from 'react-barcode';
import styled from 'styled-components';

import { getBarcodeInfo, isGS1RDCode } from '@/utils/barcode/barcode';

type StatusBadgeProps = {
  valid?: boolean;
};

type BarcodeInfoModalProps = {
  visible: boolean;
  onClose: () => void;
  barcodeValue?: string;
};

const HeaderContainer = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const InfoSection = styled.div`
  padding: 12px 0;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 8px 16px;
  font-size: 12px;
  color: #595959;
`;

const InfoLabel = styled.div`
  font-weight: 500;
  color: #262626;
  white-space: nowrap;
`;

const InfoValue = styled.div`
  font-family: 'JetBrains Mono', 'Fira Code', Monaco, monospace;
  color: #595959;
  text-align: right;
`;

const StatusBadge = styled.span<StatusBadgeProps>`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  font-size: 11px;
  font-weight: 500;
  color: ${(props: any) => (props.valid ? '#52c41a' : '#fa8c16')};
  background: ${(props: any) => (props.valid ? '#f6ffed' : '#fff2e8')};
  border-radius: 4px;
`;

const MonospaceText = styled.div`
  margin-bottom: 12px;
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  color: #262626;
`;

const ModalBarcodeContainer = styled.div`
  margin-bottom: 16px;
  text-align: center;
`;

const ModalBarcodeDisplay = styled.div<StatusBadgeProps>`
  padding: 8px;
  background-color: ${(props: any) => (props.valid ? '#f6ffed' : '#fffbe6')};
  border: 2px solid ${(props: any) => (props.valid ? '#52c41a' : '#faad14')};
  border-radius: 4px;
`;

export const BarcodeInfoModal = ({
  visible,
  onClose,
  barcodeValue,
}: BarcodeInfoModalProps) => {
  const barcodeInfo = barcodeValue ? getBarcodeInfo(barcodeValue) : null;
  const validBarcodeInfo = barcodeInfo?.valid ? barcodeInfo : null;
  const gs1Structure =
    validBarcodeInfo?.structure && typeof validBarcodeInfo.structure === 'object'
      ? (validBarcodeInfo.structure as {
          companyPrefix?: string;
          itemReference?: string;
          checkDigit?: string;
        })
      : null;
  const detailedInfo =
    barcodeValue && barcodeInfo ? (
      <InfoSection>
        <InfoGrid>
          <InfoLabel>Estado:</InfoLabel>
          <InfoValue>
            <StatusBadge valid={barcodeInfo.valid}>
              {barcodeInfo.valid ? 'Válido' : 'Requiere revisión'}
            </StatusBadge>
          </InfoValue>

          <InfoLabel>Formato:</InfoLabel>
          <InfoValue>{barcodeInfo.type || 'Desconocido'}</InfoValue>

          {validBarcodeInfo?.country && (
            <>
              <InfoLabel>País:</InfoLabel>
              <InfoValue>{validBarcodeInfo.country.country}</InfoValue>
            </>
          )}

          <InfoLabel>Longitud:</InfoLabel>
          <InfoValue>{barcodeValue.length} dígitos</InfoValue>

          {gs1Structure && isGS1RDCode(barcodeValue) && (
            <>
              <InfoLabel>Estándar:</InfoLabel>
              <InfoValue>GS1 República Dominicana</InfoValue>

              <InfoLabel>Prefijo empresa:</InfoLabel>
              <InfoValue>{gs1Structure.companyPrefix ?? '-'}</InfoValue>

              <InfoLabel>Referencia:</InfoLabel>
              <InfoValue>{gs1Structure.itemReference ?? '-'}</InfoValue>

              <InfoLabel>Dígito verificador:</InfoLabel>
              <InfoValue>{gs1Structure.checkDigit ?? '-'}</InfoValue>
            </>
          )}

          {barcodeInfo.checkDigit && (
            <>
              <InfoLabel>Verificación:</InfoLabel>
              <InfoValue>
                <StatusBadge valid={barcodeInfo.checkDigit.isValid}>
                  {barcodeInfo.checkDigit.isValid ? 'Correcto' : 'Incorrecto'}
                </StatusBadge>
              </InfoValue>
            </>
          )}
        </InfoGrid>
      </InfoSection>
    ) : null;

  return (
    <Modal
      title={
        <HeaderContainer>
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
          Información del Código de Barras
        </HeaderContainer>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
      width={500}
    >
      <ModalBarcodeContainer>
        <MonospaceText>{barcodeValue}</MonospaceText>
        <ModalBarcodeDisplay valid={barcodeInfo?.valid}>
          <Barcode width={1} height={50} value={barcodeValue || '-'} />
        </ModalBarcodeDisplay>
      </ModalBarcodeContainer>

      {detailedInfo}
    </Modal>
  );
};
