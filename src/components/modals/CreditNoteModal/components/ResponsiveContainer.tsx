import { Modal, Drawer } from 'antd';
import React from 'react';
import styled from 'styled-components';

import type { DrawerProps, ModalProps } from 'antd';

type DestroyOnHiddenProp = {
  destroyOnHidden?: boolean;
};

interface ResponsiveContainerProps {
  isMobile: boolean;
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
}

export const ResponsiveContainer = ({
  isMobile,
  isOpen,
  onClose,
  title,
  children,
}: ResponsiveContainerProps) => {
  if (isMobile) {
    const drawerProps: DrawerProps & DestroyOnHiddenProp = {
      title,
      placement: 'bottom',
      open: isOpen,
      onClose,
      size: 'large',
      closable: true,
      destroyOnHidden: true,
      styles: {
        body: { padding: '16px' },
        header: {
          borderBottom: '1px solid #f0f0f0',
          padding: '16px 24px',
        },
      },
    };

    return (
      <StyledDrawer {...drawerProps}>
        <DrawerContent>{children}</DrawerContent>
      </StyledDrawer>
    );
  }

  const modalProps: ModalProps & DestroyOnHiddenProp = {
    title,
    open: isOpen,
    onCancel: onClose,
    width: 1100,
    style: { top: '20px' },
    footer: null,
    destroyOnHidden: true,
  };

  return <Modal {...modalProps}>{children}</Modal>;
};

const StyledDrawer = styled(Drawer)`
  .ant-drawer-content {
    border-radius: 16px 16px 0 0;
  }

  .ant-drawer-header {
    border-radius: 16px 16px 0 0;
  }

  .ant-drawer-close {
    font-size: 16px;
    color: #666;
  }
`;

const DrawerContent = styled.div`
  height: 100%;
  padding-bottom: 20px;
  overflow-y: auto;

  /* Better touch scrolling on iOS */
  -webkit-overflow-scrolling: touch;

  /* Smooth scrolling */
  scroll-behavior: smooth;
`;
