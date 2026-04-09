import { EllipsisOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { createElement } from 'react';
import styled from 'styled-components';

import { Modal } from '@/components/common/Modal/Modal';

export const StyledInvoicePanelModal = styled(Modal).attrs({
  destroyOnHidden: true,
  styles: {
    body: {
      padding: 0,
    },
  },
})``;

export const ScrollableBody = styled.div`
  padding: 16px 20px 20px;
`;

export const DropdownOverlay = styled.div`
  min-width: 180px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgb(0 0 0 / 10%);
  overflow: hidden;
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

export const OverlayDivider = styled.div`
  height: 1px;
  background: #f0f0f0;
`;

export const CancelItem = styled.button<{ disabled?: boolean }>`
  display: block;
  width: 100%;
  padding: 10px 14px;
  background: none;
  border: none;
  text-align: left;
  font-size: 13px;
  color: ${({ disabled }) => (disabled ? 'rgba(0,0,0,0.25)' : '#ff4d4f')};
  cursor: ${({ disabled }) => (disabled ? 'not-allowed' : 'pointer')};

  &:hover:not(:disabled) {
    background: #fff1f0;
  }
`;

export const SplitMenuButton = styled(Button).attrs({
  icon: createElement(EllipsisOutlined, {
    style: { fontSize: 18, lineHeight: 1 },
  }),
})`
  padding: 0 8px;
`;
