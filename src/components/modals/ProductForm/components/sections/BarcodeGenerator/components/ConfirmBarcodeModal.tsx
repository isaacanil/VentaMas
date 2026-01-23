import { Modal, Space, Button, Typography, Tag } from 'antd';
import React from 'react';

import { analyzeBarcodeStructure } from '@/utils/barcode/barcode';
import type { ProductRecord } from '@/types/products';

const { Text } = Typography;

type ConfirmBarcodeModalProps = {
  open: boolean;
  onCancel: () => void;
  pendingCode?: string | null;
  product?: ProductRecord | null;
  handleConfirmGenerate: () => void;
  loading?: boolean;
};

const ConfirmBarcodeModal = ({
  open,
  onCancel,
  pendingCode,
  product,
  handleConfirmGenerate,
  loading = false,
}: ConfirmBarcodeModalProps) => {
  return (
    <Modal
      title={product?.name || 'Producto'}
      open={open}
      onCancel={onCancel}
      // Habilitar todas las formas comunes de cierre
      closable
      maskClosable
      keyboard
      footer={
        <Space>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            type="primary"
            onClick={handleConfirmGenerate}
            loading={loading}
          >
            Actualizar
          </Button>
        </Space>
      }
      width={400}
      destroyOnHidden
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <Text strong>Nuevo código de barras:</Text>

        {pendingCode && (
          <div>
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: '#f0f0f0',
                borderRadius: '6px',
              }}
            >
              <Text
                style={{
                  fontFamily: 'monospace',
                  fontSize: '18px',
                  fontWeight: 'bold',
                }}
              >
                {pendingCode}
              </Text>
            </div>

            <div style={{ marginTop: '12px' }}>
              {(() => {
                const analysis = analyzeBarcodeStructure(pendingCode);
                return (
                  <Space wrap>
                    {analysis.country && (
                      <Tag color="green">{analysis.country.country}</Tag>
                    )}
                  </Space>
                );
              })()}
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};

export default ConfirmBarcodeModal;
