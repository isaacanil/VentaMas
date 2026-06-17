import { DownOutlined } from '@ant-design/icons';
import styled from 'styled-components';

export const Container = styled.div`
  width: 100%;
`;

export const SummaryButton = styled.button`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 10px;
  background: #fafafa;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    background-color 0.16s ease;

  &:hover {
    border-color: #bfbfbf;
  }
`;

export const SummaryContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
`;

export const SummaryHeading = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SummaryMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

export const SummaryFooter = styled.div`
  width: 100%;
`;

export const Chevron = styled(DownOutlined)<{ $expanded: boolean }>`
  color: rgba(0, 0, 0, 0.45);
  transition: transform 0.16s ease;
  transform: rotate(${({ $expanded }) => ($expanded ? '180deg' : '0deg')});
`;

export const FloatingPanel = styled.div`
  display: flex;
  flex-direction: column;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 10px 30px rgb(0 0 0 / 12%);
  overflow: hidden;
  z-index: 1200;
`;

export const PanelBody = styled.div`
  position: relative;
  padding: 12px 12px 20px;

  .ant-input {
    font-size: 13px;
  }
`;

export const CharCount = styled.span`
  position: absolute;
  right: 16px;
  bottom: 6px;
  font-size: 11px;
  color: rgba(0, 0, 0, 0.35);
`;

export const PanelActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #f5f5f5;
  background: #fafafa;
`;
