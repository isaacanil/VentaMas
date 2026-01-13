import { Modal, InputNumber, Button, Alert, Typography, Space } from 'antd';
import { useMemo, useState } from 'react';

import type { BackorderGroup } from '../types';

const { Text } = Typography;

interface FulfillModalProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (amount: number) => Promise<void> | void;
  group: BackorderGroup | null;
  loading?: boolean;
}

const FulfillModal = ({
  open,
  onCancel,
  onConfirm,
  group,
  loading = false,
}: FulfillModalProps) => {
  const [amount, setAmount] = useState<number | null>(null);

  const pendingTotal = group?.pendingQuantity || 0;
  const max = pendingTotal;

  const isValid = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && n > 0 && n <= max;
  }, [amount, max]);

  return (
    <Modal
      title={
        group ? `Cubrir backorders · ${group.productName}` : 'Cubrir backorders'
      }
      open={open}
      onCancel={onCancel}
      footer={null}
      destroyOnHidden
    >
      {!group ? null : (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text type="secondary">
            Pendiente total: {pendingTotal} de {group.totalQuantity}
          </Text>
          <div>
            <Text style={{ marginRight: 8 }}>Cantidad a cubrir:</Text>
            <InputNumber
              min={1}
              max={max}
              value={amount ?? undefined}
              onChange={(value) => {
                if (typeof value === 'number') {
                  setAmount(value);
                } else if (typeof value === 'string') {
                  const numeric = Number(value);
                  setAmount(Number.isFinite(numeric) ? numeric : null);
                } else {
                  setAmount(null);
                }
              }}
              disabled={loading}
            />
            <Button
              style={{ marginLeft: 8 }}
              onClick={() => setAmount(max)}
              disabled={max === 0 || loading}
            >
              Cubrir todo
            </Button>
          </div>
          <Alert
            type="info"
            showIcon
            message="Se aplicará primero a los backorders más antiguos (FIFO)."
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button
              type="primary"
              disabled={!isValid || loading}
              loading={loading}
              onClick={async () => {
                try {
                  await onConfirm(Number(amount));
                  setAmount(null); // limpiar para permitir nuevas entradas
                } catch {
                  // no limpiar si falla
                }
              }}
            >
              Confirmar
            </Button>
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default FulfillModal;
