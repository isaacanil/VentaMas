import type { ProviderInfo } from '@/utils/provider/types';

interface ProviderOptionProps {
  provider: ProviderInfo;
  orderCount?: number;
}

const ProviderOption = ({ provider, orderCount = 0 }: ProviderOptionProps) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{provider.name || 'Proveedor'}</span>
      <span style={{ marginLeft: '10px', color: 'gray' }}>
        {orderCount > 0
          ? `${orderCount} pedido${orderCount > 1 ? 's' : ''}`
          : 'Sin pedidos'}
      </span>
    </div>
  );
};

export default ProviderOption;
