import { Card, Button, Typography } from 'antd';
import styled from 'styled-components';

const { Title: AntTitle, Paragraph: AntParagraph } = Typography;

export const Title = styled(AntTitle)`
  &.ant-typography {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
  }
`;

export const Paragraph = styled(AntParagraph)`
  &.ant-typography {
    margin: 0;
    color: #595959;
    font-size: 13px;
    line-height: 1.6;
  }
`;

export const StyledCard = styled(Card)`
  margin-bottom: 24px;
  overflow: hidden;
  border: 1px solid #eef0f2;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 4px 6px rgb(0 0 0 / 13%);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);

  .ant-card-body {
    padding: 28px;
  }
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
`;

export const HeaderLeft = styled.div`
  display: flex;
  gap: 20px;
  align-items: flex-start;
`;

export const IconWrapper = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 1px solid #bae7ff;
  border-radius: 16px;
  background: linear-gradient(135deg, #f0f7ff 0%, #e6f7ff 100%);
  color: #1890ff;
  font-size: 28px;
`;

export const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ContentSection = styled.div`
  margin-top: 16px;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 20px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px dashed #eef0f2;
`;

export const SummaryItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const SummaryLabel = styled.div`
  color: #8c8c8c;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.8px;
  text-transform: uppercase;
`;

export const SummaryValue = styled.div`
  display: flex;
  gap: 6px;
  align-items: center;
  color: #262626;
  font-size: 14px;
  font-weight: 600;
`;

export const ActionGroup = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

export const ActionButton = styled(Button)`
  display: flex;
  gap: 8px;
  align-items: center;
  height: 40px;
  padding: 0 20px;
  border-radius: 12px;
  color: #1890ff;
  font-weight: 600;
  transition: all 0.3s ease;

  &:hover {
    background: #f0f7ff;
  }
`;
