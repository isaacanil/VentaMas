import { Button } from 'antd';
import styled from 'styled-components';

export const EditorWrapper = styled.div`
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  background: #fafbfc;
  overflow: hidden;
  margin-bottom: 16px;
`;

export const EditorHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf1 100%);
  border-bottom: 1px solid #e8ecf1;
`;

export const LabelHelp = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
`;

export const HelpIconButton = styled(Button)`
  &&& {
    width: 20px;
    min-width: 20px;
    height: 20px;
    padding: 0;
    color: #94a3b8;

    &:hover {
      color: #475569;
      background: rgb(148 163 184 / 10%);
    }
  }
`;

export const EntryList = styled.div`
  max-height: 320px;
  overflow-y: auto;
`;

export const EmptyMessage = styled.div`
  padding: 20px;
  text-align: center;
  color: #94a3b8;
  font-size: 13px;
`;

export const EntryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-bottom: 1px solid #f1f5f9;
  transition: background-color 0.15s ease;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #f0f4ff;
  }
`;

export const EntryLabel = styled.span`
  flex: 1;
  font-size: 13px;
  color: #334155;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
  line-height: 28px;
`;

export const EntryValue = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 80px;
`;

export const NumberDisplay = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 60px;
  padding: 2px 10px;
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;

  &:hover,
  &:focus {
    border-color: #3b82f6;
    background: #eff6ff;
    outline: none;
    box-shadow: 0 0 0 2px rgb(59 130 246 / 12%);
  }

  .unlimited {
    color: #6366f1;
    font-style: italic;
    font-weight: 400;
    font-size: 12px;
  }
`;

export const PreflightContent = styled.div`
  max-height: 280px;
  overflow: auto;
  margin-top: 6px;

  pre {
    margin: 0;
    white-space: pre-wrap;
    font-size: 12px;
  }
`;
