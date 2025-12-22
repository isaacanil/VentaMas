import { Modal, Typography } from 'antd';
import Barcode from 'react-barcode';
import styled from 'styled-components';

import useBarcodeSettings from '../../../../../../../hooks/barcode/useBarcodeSettings';

const { Text } = Typography;

const PreviewBox = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
`;

export const BarcodePreviewModal = ({
  visible,
  onClose,
  selectedStandard = 'gs1rd',
  nextItemReference,
}) => {
  const { settings } = useBarcodeSettings();

  const countryPrefix =
    {
      gs1rd: '746',
      gs1us: '0',
      gs1mx: '750',
      gs1co: '770',
      gs1ar: '778',
      gs1cl: '780',
      gs1pe: '775',
    }[selectedStandard] || '746';

  const previewText =
    settings?.companyPrefix && nextItemReference
      ? `${countryPrefix} | ${settings.companyPrefix} | ${nextItemReference} | X`
      : 'Completa la configuración para ver la previsualización';

  const valueForBarcode =
    settings?.companyPrefix && nextItemReference
      ? `${countryPrefix}${settings.companyPrefix}${nextItemReference}`
      : '-';

  return (
    <Modal
      title="Previsualización del Próximo Código"
      open={visible}
      onCancel={onClose}
      footer={null}
      width={520}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <PreviewBox>
          <Barcode width={1} height={50} value={valueForBarcode} />
        </PreviewBox>
        <Text
          type="secondary"
          style={{ fontFamily: 'monospace', textAlign: 'center' }}
        >
          {previewText}
        </Text>
      </div>
    </Modal>
  );
};

export default BarcodePreviewModal;
