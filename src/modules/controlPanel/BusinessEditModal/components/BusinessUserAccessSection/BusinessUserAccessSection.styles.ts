import { Card, Space, Typography } from 'antd';
import styled from 'styled-components';

export const UserSectionTitle = styled(Typography.Title)`
  && {
    display: flex;
    gap: 8px;
    align-items: center;
  }
`;

export const UserAccessCard = styled(Card)`
  margin-top: 16px;
  background-color: #f0f7ff;
  border-color: #d6e8fd;
`;

export const FullWidthSpace = styled(Space)`
  width: 100%;
`;
