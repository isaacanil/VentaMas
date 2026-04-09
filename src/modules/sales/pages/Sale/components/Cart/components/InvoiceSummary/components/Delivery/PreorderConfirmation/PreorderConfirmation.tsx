import type { InvoiceData } from '@/types/invoice';
import { Modal, Button, Checkbox, Typography, Space } from 'antd';

const { Text } = Typography;

type PreorderRecord = {
  data?: InvoiceData | null;
};

type PreorderConfirmationProps = {
  open: boolean;
  onConfirm?: () => void;
  onCancel?: () => void;
  preorder?: PreorderRecord | null;
  loading?: boolean;
  actionType?: 'complete' | 'update';
  shouldPrint?: boolean;
  onTogglePrint?: (value: boolean) => void;
};

export const PreorderConfirmation = ({
  open,
  onConfirm,
  onCancel,
  preorder,
  loading = false,
  actionType = 'complete',
  shouldPrint = false,
  onTogglePrint,
}: PreorderConfirmationProps) => {
  const preorderNumber =
    preorder?.data?.preorderDetails?.numberID ||
    preorder?.data?.numberID ||
    'N/A';
  const clientName = preorder?.data?.client?.name || 'N/A';

  const isUpdate = actionType === 'update';
  const title = isUpdate ? 'Actualizar preventa' : 'Confirmar preventa';

  const primaryLabel = isUpdate ? 'Actualizar' : 'Completar';

  const printToggleLabel = isUpdate
    ? 'Imprimir al actualizar'
    : 'Imprimir al completar';

  return (
    <Modal
      title={title}
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={primaryLabel}
      cancelText="Cancelar"
      centered
      maskClosable={!loading}
      closable={!loading}
      keyboard={!loading}
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={loading}>
          Cancelar
        </Button>,
        <Button
          key="confirm"
          type="primary"
          loading={loading}
          onClick={onConfirm}
        >
          {primaryLabel}
        </Button>,
      ]}
    >
      <Space
        orientation="vertical"
        size="middle"
        style={{ width: '100%', padding: '8px 0' }}
      >
        <Text style={{ fontSize: '16px', display: 'block' }}>
          {isUpdate
            ? '¿Deseas actualizar la preventa'
            : '¿Deseas completar la preventa'}{' '}
          <strong>{preorderNumber}</strong> para el cliente{' '}
          <strong>{clientName}</strong>?
        </Text>

        <div
          style={{
            padding: '12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #f1f5f9',
          }}
        >
          <Checkbox
            checked={shouldPrint}
            onChange={(e) => onTogglePrint?.(e.target.checked)}
            disabled={loading}
          >
            {printToggleLabel}
          </Checkbox>
        </div>
      </Space>
    </Modal>
  );
};
