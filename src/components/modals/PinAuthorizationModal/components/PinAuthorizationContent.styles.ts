import { Alert, Divider, Typography } from 'antd';
import styled from 'styled-components';

const { Paragraph: AntParagraph, Text: AntText } = Typography;

export const ContentGrid = styled.div`
  display: grid;
  gap: 12px;
`;

export const IconHeader = styled.div`
  margin-bottom: 8px;
  text-align: center;
`;

export const AuthorizationIcon = styled.span<{ $mode: 'password' | 'pin' }>`
  color: ${({ $mode }) => ($mode === 'password' ? '#1890ff' : '#52c41a')};
  font-size: 48px;
`;

export const DescriptionParagraph = styled(AntParagraph)`
  &.ant-typography {
    margin-bottom: 8px;
    text-align: center;
  }
`;

export const ReasonList = styled.ul`
  margin: 0;
  padding-left: 18px;
`;

export const ReasonItem = styled.li`
  font-size: 13px;
`;

export const ModeAlert = styled(Alert)`
  margin-top: 8px;
`;

export const PinLabel = styled(AntText)`
  display: block;
  margin-bottom: 8px;
`;

export const LoadingRow = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 8px;
`;

export const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 2em;
  margin-top: 0.8em;
  padding: 8px 12px;
  border: 1px solid #ef5350;
  border-radius: 4px;
  background-color: #ffebee;
  color: #d32f2f;
  font-size: 0.95em;
  font-weight: 500;
`;

export const ModeToggle = styled.div`
  margin-top: 16px;
  text-align: center;

  button {
    height: auto;
    padding: 0;
    font-size: 0.9em;
  }
`;

export const ModeDivider = styled(Divider)`
  margin: 12px 0;
`;

export const ModeSeparatorText = styled(AntText)`
  font-size: 0.85em;
`;
