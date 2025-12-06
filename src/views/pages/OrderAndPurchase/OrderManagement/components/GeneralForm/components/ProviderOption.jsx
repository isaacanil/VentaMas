import React from 'react';

const ProviderOption = ({ provider, orderCount }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <span>{provider.name}</span>
      <span style={{ marginLeft: '10px', color: 'gray' }}>
        {orderCount > 0
          ? `${orderCount} pedido${orderCount > 1 ? 's' : ''}`
          : 'Sin pedidos'}
      </span>
    </div>
  );
};

export default ProviderOption;
