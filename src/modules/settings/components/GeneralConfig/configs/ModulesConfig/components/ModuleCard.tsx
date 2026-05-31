import { Button, Switch, Tag, Typography } from 'antd';

import { STATUS_CONFIG } from './ModuleCard.helpers';
import {
  CardTitle,
  Description,
  Footer,
  Header,
  HeaderMain,
  Helper,
  IconSurface,
  StyledCard,
  SummaryGrid,
  SummaryItem,
  SummaryLabel,
  SummaryValue,
  SwitchColumn,
  TitleRow,
} from './ModuleCard.styles';
import type { ModuleCardProps, ModuleStatus } from './ModuleCard.types';

const { Text } = Typography;

export type { ModuleStatus };

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
              <CardTitle level={5}>{title}</CardTitle>
              <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
            </TitleRow>
            <Description>{description}</Description>
          </div>
        </HeaderMain>

        <SwitchColumn>
          <Switch checked={checked} loading={loading} onChange={onToggle} />
          <Text type="secondary">
            {checked ? 'Habilitado' : 'Deshabilitado'}
          </Text>
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
