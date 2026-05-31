import type { ReactNode } from 'react';
import { SettingOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

import {
  ActionButton,
  ActionGroup,
  CardHeader,
  ContentSection,
  ContentWrapper,
  HeaderLeft,
  IconWrapper,
  Paragraph,
  StyledCard,
  SummaryGrid,
  SummaryItem,
  SummaryLabel,
  SummaryValue,
  Title,
} from './SettingCard.styles';

interface SettingCardSummaryItem {
  label: string;
  value: ReactNode;
}

interface SettingCardProps {
  icon: ReactNode;
  title: string;
  description: ReactNode;
  extra?: ReactNode;
  summary?: SettingCardSummaryItem[];
  children?: ReactNode;
  onConfigClick?: () => void;
  disabledSettings?: boolean;
}

const SettingCard = ({
  icon,
  title,
  description,
  extra,
  summary,
  children,
  onConfigClick,
  disabledSettings = false,
}: SettingCardProps) => {
  return (
    <StyledCard>
      <CardHeader>
        <HeaderLeft>
          <IconWrapper>{icon}</IconWrapper>
          <ContentWrapper>
            <Title level={5}>{title}</Title>
            <Paragraph>{description}</Paragraph>
          </ContentWrapper>
        </HeaderLeft>
        <ActionGroup>
          {extra}
          {onConfigClick && (
            <Tooltip title="Personalizar configuraciones">
              <ActionButton
                type="text"
                icon={<SettingOutlined />}
                onClick={onConfigClick}
                disabled={disabledSettings}
              >
                Configurar
              </ActionButton>
            </Tooltip>
          )}
        </ActionGroup>
      </CardHeader>

      {children && <ContentSection>{children}</ContentSection>}

      {summary && (
        <SummaryGrid>
          {summary.map((item) => (
            <SummaryItem key={item.label}>
              <SummaryLabel>{item.label}</SummaryLabel>
              <SummaryValue>{item.value}</SummaryValue>
            </SummaryItem>
          ))}
        </SummaryGrid>
      )}
    </StyledCard>
  );
};

export default SettingCard;
