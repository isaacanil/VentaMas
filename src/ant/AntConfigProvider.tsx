import { ConfigProvider } from 'antd';
import React from 'react';

import { antTheme } from '@/design-system';

const modalConfig = {
  styles: {
    mask: {
      backgroundColor: 'var(--ds-color-overlay-mask)',
    },
  },
};

export const AntConfigProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  return (
    <ConfigProvider theme={antTheme} modal={modalConfig}>
      {children}
    </ConfigProvider>
  );
};
