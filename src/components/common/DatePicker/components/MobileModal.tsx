import React from 'react';
import { createGlobalStyle } from 'styled-components';

import { VmDrawer } from '@/components/heroui';

interface MobileModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const DatePickerDrawerLayer = createGlobalStyle`
  .vm-date-picker-mobile-drawer-backdrop {
    z-index: 1700 !important;
  }

  .vm-date-picker-mobile-drawer-content {
    z-index: 1701 !important;
    overflow-x: hidden !important;
  }

  .vm-date-picker-mobile-drawer-content [data-slot='drawer-body'] {
    overflow-x: hidden !important;
  }
`;

export const MobileModal = ({
  open,
  onClose,
  title,
  children,
}: MobileModalProps) => {
  return (
    <>
      <DatePickerDrawerLayer />
      <VmDrawer
        isOpen={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) onClose();
        }}
        title={title}
        placement="bottom"
        ariaLabel={title}
        backdropClassName="vm-date-picker-mobile-drawer-backdrop"
        contentClassName="vm-date-picker-mobile-drawer-content"
      >
        {children}
      </VmDrawer>
    </>
  );
};
