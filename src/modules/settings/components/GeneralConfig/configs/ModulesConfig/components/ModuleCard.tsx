import { Button, Card, Switch, Tag, Typography } from 'antd';
import type { ReactNode } from 'react';
import styled from 'styled-components';

const { Paragraph, Text, Title } = Typography;

export type ModuleStatus = 'active' | 'inactive' | 'config-pending';

const STATUS_CONFIG: Record<
  ModuleStatus,
  { color: string; label: string }
> = {
  active: {
    color: 'success',
    label: 'Activo',
  },
  inactive: {
    color: 'default',
    label: 'Inactivo',
  },
  'config-pending': {
    color: 'warning',
    label: 'Configuración pendiente',
  },
};

const StyledCard = styled(Card)`
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-xl);
  box-shadow: var(--ds-shadow-sm);

  .ant-card-body {
    display: grid;
    gap: var(--ds-space-5);
    padding: var(--ds-space-5);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-4);
  align-items: flex-start;
`;

const HeaderMain = styled.div`
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr);
  gap: var(--ds-space-4);
  align-items: flex-start;
`;

const IconSurface = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-primary);
  border: 1px solid var(--ds-color-border-default);
  font-size: 20px;
`;

const TitleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-2);
  align-items: center;
`;

const SwitchColumn = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  justify-items: end;
  flex-shrink: 0;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--ds-space-4);
  padding-top: var(--ds-space-4);
  border-top: 1px solid var(--ds-color-border-subtle);
`;

const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const SummaryLabel = styled(Text)`
  && {
    font-size: var(--ds-font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--ds-color-text-tertiary);
  }
`;

const SummaryValue = styled(Text)`
  && {
    font-size: var(--ds-font-size-sm);
    color: var(--ds-color-text-primary);
  }
`;

const Footer = styled.div`
  display: flex;
  justify-content: space-between;
  gap: var(--ds-space-3);
  align-items: center;
  flex-wrap: wrap;
`;

const Helper = styled(Paragraph)`
  && {
    margin: 0;
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }
`;

interface ModuleCardSummaryItem {
  label: string;
  value: ReactNode;
}

interface ModuleCardProps {
  checked: boolean;
  configureDisabled?: boolean;
  description: ReactNode;
  helperText?: ReactNode;
  icon: ReactNode;
  loading?: boolean;
  onConfigure?: () => void;
  onToggle: (checked: boolean) => void;
  status: ModuleStatus;
  summary: ModuleCardSummaryItem[];
  title: string;
}

export const ModuleCard = ({
  checked,
  configureDisabled = false,
  description,
  helperText,
  icon,
  loading = false,
  onConfigure,
  onToggle,
  status,
  summary,
  title,
}: ModuleCardProps) => {
  const statusConfig = STATUS_CONFIG[status];

  return (
    <StyledCard>
      <Header>
        <HeaderMain>
          <IconSurface>{icon}</IconSurface>
          <div>
            <TitleRow>
              <Title level={5} style={{ margin: 0 }}>
                {title}
              </Title>
              <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            </TitleRow>
            <Paragraph
              style={{
                margin: '8px 0 0',
                color: 'var(--ds-color-text-secondary)',
              }}
            >
              {description}
            </Paragraph>
          </div>
        </HeaderMain>

        <SwitchColumn>
          <Switch checked={checked} loading={loading} onChange={onToggle} />
          <Text type="secondary">{checked ? 'Habilitado' : 'Deshabilitado'}</Text>
        </SwitchColumn>
      </Header>

      <SummaryGrid>
        {summary.map((item) => (
          <SummaryItem key={item.label}>
            <SummaryLabel>{item.label}</SummaryLabel>
            <SummaryValue>{item.value}</SummaryValue>
          </SummaryItem>
        ))}
      </SummaryGrid>

      <Footer>
        <Helper>{helperText}</Helper>
        {onConfigure ? (
          <Button onClick={onConfigure} disabled={configureDisabled}>
            Configurar
          </Button>
        ) : null}
      </Footer>
    </StyledCard>
  );
};

export default ModuleCard;
