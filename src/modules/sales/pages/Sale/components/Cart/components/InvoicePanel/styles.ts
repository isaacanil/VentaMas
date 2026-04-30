import { Drawer, Modal } from '@heroui/react';
import styled from 'styled-components';

export const InvoicePanelDialog = styled(Modal.Dialog)`
  width: min(640px, calc(100vw - 32px));
  max-height: calc(100vh - 32px);
  padding: 0;

  .modal__header {
    padding: 24px 24px 0;
  }
`;

export const InvoicePanelBody = styled(Modal.Body)`
  padding: 0;
`;

export const InvoicePanelFooter = styled(Modal.Footer)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 16px 16px;
`;

export const InvoicePanelDrawerDialog = styled(Drawer.Dialog)`
  max-height: 92vh;
  padding: 0;

  .drawer__header {
    padding: 20px 20px 0;
  }
`;

export const InvoicePanelDrawerBody = styled(Drawer.Body)`
  padding: 0;
`;

export const InvoicePanelDrawerFooter = styled(Drawer.Footer)`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 0 16px 16px;
`;

export const ScrollableBody = styled.div`
  padding: 0px 20px;
`;

export const PrintToggleItem = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  cursor: default;
  user-select: none;

  span {
    font-size: 13px;
    color: rgba(0, 0, 0, 0.85);
  }
`;
