import { Card, Typography } from 'antd';
import styled from 'styled-components';

const { Paragraph, Text, Title: AntTitle } = Typography;

export const StyledCard = styled(Card)`
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-sm);

  .ant-card-body {
    display: grid;
    gap: var(--ds-space-5);
    padding: var(--ds-space-5);
  }
`;

export const Header = styled.div`
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  justify-content: space-between;
`;

export const HeaderMain = styled.div`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: var(--ds-space-4);
  align-items: flex-start;
`;

export const IconSurface = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-primary);
  font-size: 20px;
`;

export const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
`;

export const CardTitle = styled(AntTitle)`
  &.ant-typography {
    margin: 0;
  }
`;

export const Description = styled(Paragraph)`
  &.ant-typography {
    margin: 8px 0 0;
    color: var(--ds-color-text-secondary);
  }
`;

export const SwitchColumn = styled.div`
  display: grid;
  flex-shrink: 0;
  gap: var(--ds-space-1);
  justify-items: end;
`;

export const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--ds-space-4);
  padding-top: var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-subtle);
`;

export const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

export const SummaryLabel = styled(Text)`
  && {
    color: var(--ds-color-text-tertiary);
    font-size: var(--ds-font-size-xs);
    letter-spacing: 0.06em;
    text-transform: uppercase;
  }
`;

export const SummaryValue = styled(Text)`
  && {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-sm);
  }
`;

export const Footer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
`;

export const Helper = styled(Paragraph)`
  && {
    margin: 0;
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;
