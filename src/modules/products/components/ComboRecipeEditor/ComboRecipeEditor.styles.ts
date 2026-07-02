import { Card, Form } from 'antd';
import styled from 'styled-components';

export const EditorCard = styled(Card)`
  max-width: 100%;

  .ant-card-head-title {
    font-weight: 700;
  }

  .ant-card-body {
    min-width: 0;
  }
`;

export const RecipeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
`;

export const ComponentRow = styled.div`
  padding: 14px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  min-width: 0;
`;

export const ComponentRowHeader = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

export const ComponentTitle = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  font-weight: 700;
  color: #0f172a;
`;

export const ComponentGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(120px, 180px);
  gap: 12px 16px;

  @media (width <= 760px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const CompactFormItem = styled(Form.Item)`
  margin-bottom: 0 !important;
`;

export const ComponentMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  margin-top: 10px;
`;

export const SummaryRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
`;

export const EmptyState = styled.div`
  padding: 16px;
  color: #64748b;
  text-align: center;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
`;
