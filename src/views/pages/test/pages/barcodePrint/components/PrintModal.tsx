// @ts-nocheck
import { Modal, Select, Form, Spin, Alert } from 'antd';

import QuantitySelector from './QuantitySelector';

const PrintModal = ({
  show,
  onClose,
  onPrint,
  selectedBarcode,
  quantity,
  onQuantityChange,
  codesPerPage,
  onCodesPerPageChange,
  barcodeType,
  onBarcodeTypeChange,
  barcodeTypes,
  isLoading,
}) => {
  const handleOk = () => {
    onPrint();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Modal
      open={show}
      title="Configurar Impresión"
      okText="Imprimir"
      cancelText="Cancelar"
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={isLoading}
      maskClosable={false}
      centered
      destroyOnHidden
      afterClose={onClose}
      // getContainer={false}
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

        <Form layout="vertical">
          <Form.Item label="Cantidad">
            <QuantitySelector
              quantity={quantity}
              onChange={onQuantityChange}
              max={100}
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item label="Códigos por página">
            <Select
              value={codesPerPage}
              onChange={onCodesPerPageChange} // recibe el value de la opción (número)
              options={[1, 2, 3, 4, 5, 6, 8, 10].map((n) => ({
                label: n,
                value: n,
              }))}
              disabled={isLoading}
            />
          </Form.Item>

          <Form.Item label="Tipo de código">
            <Select
              value={barcodeType}
              onChange={onBarcodeTypeChange} // recibe el value seleccionado (string)
              // Asegúrate de que barcodeTypes sea [{label:'CODE 128', value:'code128'}, ...]
              options={barcodeTypes}
              disabled={isLoading}
            />
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PrintModal;
