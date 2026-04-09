import {
  CreditCardOutlined,
  DollarOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@/constants/icons/antd';
import { Button, Modal } from 'antd';

type DecisionLoading = 'invoice' | 'cxc' | null;

type ReceivableDecisionModalProps = {
  open: boolean;
  decisionLoading: DecisionLoading;
  clientName?: string;
  onCancel: () => void;
  onChangeClient: () => void;
  onSelectInvoice: () => Promise<void> | void;
  onSelectReceivable: () => Promise<void> | void;
};

export const ReceivableDecisionModal = ({
  open,
  decisionLoading,
  clientName,
  onCancel,
  onChangeClient,
  onSelectInvoice,
  onSelectReceivable,
}: ReceivableDecisionModalProps) => (
  <Modal
    title={null}
    open={open}
    onCancel={() => {
      if (!decisionLoading) onCancel();
    }}
    closable={!decisionLoading}
    maskClosable={!decisionLoading}
    keyboard={!decisionLoading}
    footer={null}
    width={480}
    centered
  >
    <div style={{ textAlign: 'center', padding: '8px 0 0' }}>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: '#e6f4ff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 12,
        }}
      >
        <ShoppingCartOutlined style={{ fontSize: 24, color: '#1677ff' }} />
      </div>
      <h3 style={{ margin: '0 0 4px', fontSize: 18, fontWeight: 600 }}>
        Completar preventa
      </h3>
      <p style={{ color: '#666', margin: '0 0 20px', fontSize: 14 }}>
        ¿Cómo deseas procesar esta preventa?
      </p>
    </div>

    <div
      style={{
        background: '#fafafa',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
      }}
    >
      <UserOutlined style={{ fontSize: 16, color: '#999' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12, color: '#999' }}>Cliente</div>
        <div
          style={{
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {clientName?.trim() ? clientName : 'Sin cliente seleccionado'}
        </div>
      </div>
      <Button
        size="small"
        disabled={!!decisionLoading}
        onClick={onChangeClient}
      >
        Cambiar
      </Button>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <Button
        type="primary"
        size="large"
        block
        icon={<DollarOutlined />}
        loading={decisionLoading === 'invoice'}
        disabled={decisionLoading === 'cxc'}
        onClick={onSelectInvoice}
        style={{ height: 48, fontWeight: 500 }}
      >
        Pagar todo y facturar
      </Button>
      <Button
        size="large"
        block
        icon={<CreditCardOutlined />}
        loading={decisionLoading === 'cxc'}
        disabled={decisionLoading === 'invoice'}
        onClick={onSelectReceivable}
        style={{ height: 48, fontWeight: 500 }}
      >
        Usar cuenta por cobrar (CxC)
      </Button>
    </div>

    <p
      style={{
        color: '#999',
        fontSize: 12,
        textAlign: 'center',
        margin: '16px 0 0',
      }}
    >
      Con CxC se creará la cuenta por cobrar y podrás registrar el primer pago.
    </p>
  </Modal>
);
