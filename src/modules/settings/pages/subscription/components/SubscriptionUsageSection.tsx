import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Button } from 'antd';

import type { LimitRow } from '../subscription.types';
import { resolveLimitIcon } from './SubscriptionOverviewCard.helpers';
import {
  EmptyUsage,
  Section,
  SectionDesc,
  SectionHeader,
  SectionTitle,
  UsageGrid,
} from './SubscriptionOverviewCard.styles';
import { UsageItem } from './UsageItem';

interface SubscriptionUsageSectionProps {
  loading: boolean;
  usageRows: LimitRow[];
  onRefresh: () => void;
}

export const SubscriptionUsageSection = ({
  loading,
  usageRows,
  onRefresh,
}: SubscriptionUsageSectionProps) => (
  <Section>
    <SectionHeader>
      <div>
        <SectionTitle>Uso del Plan</SectionTitle>
        <SectionDesc>
          Consumo actual de recursos en el negocio activo
        </SectionDesc>
      </div>
      <Button size="small" loading={loading} onClick={onRefresh}>
        Actualizar uso
      </Button>
    </SectionHeader>
    <UsageGrid>
      {usageRows.length > 0 ? (
        usageRows.map((row) => (
          <UsageItem
            key={row.key}
            icon={<FontAwesomeIcon icon={resolveLimitIcon(row.key)} />}
            label={row.label}
            used={Math.max(0, row.usage || 0)}
            limit={row.limit ?? 0}
          />
        ))
      ) : (
        <EmptyUsage>
          No hay métricas de uso registradas todavía para este negocio.
        </EmptyUsage>
      )}
    </UsageGrid>
  </Section>
);
