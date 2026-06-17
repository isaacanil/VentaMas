import {
  ClockCircleOutlined,
  EditOutlined,
  InfoCircleOutlined,
} from '@/constants/icons/antd';
import { Typography } from 'antd';
import styled from 'styled-components';

const { Text } = Typography;

export const Wrapper = styled.div`
  display: flex;
  justify-content: flex-end;
`;

export const BadgeButton = styled.div`
  display: inline-flex;
  gap: 8px;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  background: #fffaf3;
  border: 1px solid rgb(255 171 64 / 40%);
  border-radius: 999px;
  box-shadow: 0 2px 10px rgb(255 171 64 / 15%);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;

  &:hover {
    background: #fff3e0;
    box-shadow: 0 4px 14px rgb(255 171 64 / 18%);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

export const ClockIcon = styled(ClockCircleOutlined)`
  font-size: 18px;
  color: #f57c00;
`;

export const BadgeInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  line-height: 1.1;
`;

export const BadgeLabel = styled.span`
  font-size: 10px;
  font-weight: 600;
  color: #b85b00;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

export const BadgeTime = styled.span`
  font-family: 'Courier New', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #914200;
`;

export const PopoverContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 280px;
  max-width: 320px;
`;

export const PopoverHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const HeaderIcon = styled.div`
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  color: #f57c00;
  background: rgb(255 152 0 / 12%);
  border-radius: 12px;
`;

export const HeaderIconSymbol = styled(EditOutlined)`
  font-size: 18px;
`;

export const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const PopoverTitle = styled(Text)`
  && {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: #333;
  }
`;

export const PopoverSubtitle = styled(Text)`
  && {
    font-size: 12px;
    color: #666;
  }
`;

export const PopoverDivider = styled.div`
  height: 1px;
  background: #f5f5f5;
  border-radius: 999px;
`;

export const CountdownGrid = styled.div`
  display: grid;
  grid-auto-columns: minmax(54px, auto);
  grid-auto-flow: column;
  gap: 10px;
`;

export const CountdownItem = styled.div`
  padding: 8px 10px;
  text-align: center;
  background: #fff9e7;
  border: 1px solid rgb(255 152 0 / 25%);
  border-radius: 10px;
`;

export const CountdownValue = styled.span`
  display: block;
  font-family: 'Courier New', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #e65100;
`;

export const CountdownLabel = styled.span`
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: #a15b00;
  text-transform: uppercase;
  letter-spacing: 0.4px;
`;

export const PopoverFooter = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const FooterLabel = styled(Text)`
  && {
    font-size: 12px;
    font-weight: 500;
    color: #666;
  }
`;

export const FooterValue = styled(Text)`
  && {
    font-size: 13px;
    font-weight: 600;
    color: #333;
  }
`;

export const PopoverNote = styled.div`
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 10px;
  background: rgb(255 152 0 / 8%);
  border-radius: 10px;
`;

export const NoteIcon = styled(InfoCircleOutlined)`
  margin-top: 2px;
  font-size: 16px;
  color: #ff9800;
`;

export const NoteText = styled.span`
  font-size: 12px;
  line-height: 1.4;
  color: #8d6e63;
`;
