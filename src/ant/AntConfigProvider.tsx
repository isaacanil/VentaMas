import { ConfigProvider } from 'antd';
import React from 'react';

const modalConfig = {
  // Estilos para el "backdrop"
  styles: {
    mask: {
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
    },
  },
};
export const AntConfigProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ConfigProvider modal={modalConfig}>
      {children}
    </ConfigProvider>
  );
};
