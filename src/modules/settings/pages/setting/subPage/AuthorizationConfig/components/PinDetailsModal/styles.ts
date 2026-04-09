import { Button, Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

export const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0 0;
`;

export const Header = styled.div`
  text-align: center;
`;

export const IconBadge = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto 12px;
  font-size: 28px;
  color: #fff;
  background: linear-gradient(135deg, #1890ff 0%, #52c41a 100%);
  border-radius: 18px;
`;

export const Subtitle = styled(Text)`
  display: block;
  margin-top: 6px;
  color: #8c8c8c !important;
`;

export const PinCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  padding: 20px 20px 16px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgb(9 30 66 / 8%);
`;

export const ModulePins = styled.div`
  display: grid;
  gap: 12px;
  width: 100%;
`;

export const ModulePinRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px 16px;
  background: #fafafa;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgb(24 144 255 / 8%);
`;

export const ModuleHeader = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
`;

export const ModuleLabel = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: #1f1f1f;
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

export const PinNumber = styled.div`
  padding: 6px 0;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  font-size: 26px;
  font-weight: 700;
  color: #141414;
  text-align: center;
  letter-spacing: 6px;
`;

export const PinPlaceholder = styled.div`
  padding: 6px 0;
  font-family: 'Roboto Mono', 'Courier New', monospace;
  font-size: 26px;
  font-weight: 700;
  color: #141414;
  text-align: center;
  letter-spacing: 6px;
  opacity: 0.35;
`;

export const ModuleMeta = styled.span`
  display: block;
  font-size: 12px;
  color: #595959;
  text-align: center;
`;

export const ModuleActions = styled.div`
  display: flex;
  gap: 6px;
  justify-content: flex-end;
`;

export const ModuleButton = styled(Button)`
  && {
    height: 30px;
    padding: 0 12px;
    font-size: 12px;
    color: #262626;
    background: #fff;
    border: 1px solid #d9d9d9;

    &:hover,
    &:focus {
      color: #0050b3;
      background: #e6f7ff;
      border-color: #91d5ff;
    }

    &:disabled {
      color: rgb(0 0 0 / 25%);
      background: #f5f5f5;
      border-color: #d9d9d9;
    }
  }
`;

export const PrintButton = styled(Button)`
  && {
    height: 36px;
    padding: 0 16px;
    color: #fff;
    background: #1890ff;
    border: none;

    &:hover,
    &:focus {
      color: #fff;
      background: #40a9ff;
    }
  }
`;

export const ActionBar = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 4px;
`;
