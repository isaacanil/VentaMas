import { InfoCircleOutlined } from '@ant-design/icons';
import * as ant from 'antd';
import Barcode from 'react-barcode';
import styled from 'styled-components';

import {
  getBarcodeInfo,
  isGS1RDCode,
} from '../../../../../../../utils/barcode/barcode';

const { Modal, Button } = ant;

const HeaderContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-family: 'JetBrains Mono', 'Fira Code', 'Monaco', monospace;
  color: #595959;
  text-align: right;
`;

const StatusBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: ${(props) => (props.valid ? '#f6ffed' : '#fff2e8')};
  color: ${(props) => (props.valid ? '#52c41a' : '#fa8c16')};
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
`;

const MonospaceText = styled.div`
  font-family: monospace;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 12px;
  color: #262626;
`;

const ModalBarcodeContainer = styled.div`
  margin-bottom: 16px;
  text-align: center;
`;

const ModalBarcodeDisplay = styled.div`
  padding: 8px;
  border-radius: 4px;
  border: 2px solid ${(props) => (props.valid ? '#52c41a' : '#faad14')};
  background-color: ${(props) => (props.valid ? '#f6ffed' : '#fffbe6')};
`;

export const BarcodeInfoModal = ({ visible, onClose, barcodeValue }) => {
  const barcodeInfo = barcodeValue ? getBarcodeInfo(barcodeValue) : null;

  const renderDetailedInfo = () => {
    if (!barcodeValue || !barcodeInfo) return null;

    return (
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

          {barcodeInfo.country && (
            <>
              <InfoLabel>País:</InfoLabel>
              <InfoValue>{barcodeInfo.country.country}</InfoValue>
            </>
          )}

          <InfoLabel>Longitud:</InfoLabel>
          <InfoValue>{barcodeValue.length} dígitos</InfoValue>

          {barcodeInfo.structure && isGS1RDCode(barcodeValue) && (
            <>
              <InfoLabel>Estándar:</InfoLabel>
              <InfoValue>GS1 República Dominicana</InfoValue>

              <InfoLabel>Prefijo empresa:</InfoLabel>
              <InfoValue>{barcodeInfo.structure.companyPrefix}</InfoValue>

              <InfoLabel>Referencia:</InfoLabel>
              <InfoValue>{barcodeInfo.structure.itemReference}</InfoValue>

              <InfoLabel>Dígito verificador:</InfoLabel>
              <InfoValue>{barcodeInfo.structure.checkDigit}</InfoValue>
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
    );
  };

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

      {renderDetailedInfo()}
    </Modal>
  );
};
