import { Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

export const ErrorContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 24px;
  background: var(--color-bg-container, #fff);
`;

export const StackTrace = styled.pre`
  max-height: 300px;
  padding: 16px;
  margin-top: 16px;
  overflow: auto;
  font-size: 12px;
  text-align: left;
  background: #f5f5f5;
  border-radius: 8px;
`;

export const DetailsTitle = styled(Text)`
  font-size: 16px;
`;
