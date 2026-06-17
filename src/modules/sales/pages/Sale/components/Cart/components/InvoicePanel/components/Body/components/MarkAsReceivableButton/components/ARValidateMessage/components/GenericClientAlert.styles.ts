import { Button } from 'antd';
import styled from 'styled-components';

import type { ValidationStatus } from './GenericClientAlert.utils';

type StatusStyle = {
  color: string;
  backgroundColor: string;
  borderColor: string;
};

const STATUS_STYLES: Record<ValidationStatus, StatusStyle> = {
  error: {
    color: '#ff4d4f',
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
  },
  warning: {
    color: '#faad14',
    backgroundColor: '#fffbe6',
    borderColor: '#ffe58f',
  },
  success: {
    color: '#52c41a',
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f',
  },
  info: {
    color: '#1890ff',
    backgroundColor: '#e6f7ff',
    borderColor: '#91d5ff',
  },
};

const getStatusStyle = (status: ValidationStatus) => STATUS_STYLES[status];

type StatusProps = {
  $status: ValidationStatus;
};

export const AlertShell = styled.div`
  width: 100%;
  padding: 16px;
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
`;

export const Header = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  padding-bottom: 8px;
  margin-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
`;

export const StatusMarker = styled.div<StatusProps>`
  width: 6px;
  height: 20px;
  background-color: ${({ $status }) => getStatusStyle($status).color};
  border-radius: 3px;
`;

export const HeaderTitle = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`;

export const ItemCount = styled.div`
  margin-left: auto;
  font-size: 11px;
  color: #8c8c8c;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const ValidationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ValidationCard = styled.div<StatusProps>`
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px 12px;
  background-color: ${({ $status }) =>
    getStatusStyle($status).backgroundColor};
  border: 1px solid
    ${({ $status }) => getStatusStyle($status).borderColor};
  border-radius: 6px;
  transition: all 0.2s ease;
`;

export const ValidationIcon = styled.div<StatusProps>`
  flex-shrink: 0;
  font-size: 16px;
  color: ${({ $status }) => getStatusStyle($status).color};
`;

export const ValidationContent = styled.div`
  flex: 1;
  min-width: 0;
`;

export const ValidationTitle = styled.div`
  margin-bottom: 2px;
  font-size: 13px;
  font-weight: 500;
  color: #262626;
`;

export const ValidationMessage = styled.div`
  font-size: 12px;
  line-height: 1.3;
  color: #595959;
`;

export const StatusBadge = styled.div<StatusProps>`
  flex-shrink: 0;
  padding: 2px 6px;
  font-size: 10px;
  font-weight: 500;
  color: ${({ $status }) => getStatusStyle($status).color};
  text-transform: uppercase;
  letter-spacing: 0.3px;
  background-color: rgb(255 255 255 / 80%);
  border-radius: 10px;
`;

export const ActionRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #f0f0f0;
`;

export const ActionButton = styled(Button)`
  && {
    height: 32px;
    font-size: 12px;
    font-weight: 500;
    border-radius: 6px;
  }
`;
