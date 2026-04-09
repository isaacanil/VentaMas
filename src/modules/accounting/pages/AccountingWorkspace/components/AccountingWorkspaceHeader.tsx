import { Button } from 'antd';
import styled from 'styled-components';

import { designSystemV2 } from '@/theme/designSystemV2';

import type { AccountingWorkspaceSummary } from '../utils/accountingWorkspace';

interface AccountingWorkspaceHeaderProps {
  functionalCurrency: string;
  onOpenSettings: () => void;
  postingAccountsCount: number;
  postingProfilesCount: number;
  summary: AccountingWorkspaceSummary;
}

export const AccountingWorkspaceHeader = ({
  functionalCurrency,
  onOpenSettings,
  postingAccountsCount,
  postingProfilesCount,
  summary,
}: AccountingWorkspaceHeaderProps) => (
  <Header>
    <HeaderCopy>
      <Eyebrow>Modulo operativo contable</Eyebrow>
      <Title>Libro diario, ajustes, reportes y cierre en una sola superficie.</Title>
      <Body>
        Trabaja sobre eventos contables, asientos manuales y cierres mensuales
        sin regresar a configuracion.
      </Body>
    </HeaderCopy>

    <HeaderActions>
      <MetricStrip>
        <MetricItem>
          <MetricValue>{summary.automaticRecords}</MetricValue>
          <MetricLabel>movimientos automaticos</MetricLabel>
        </MetricItem>
        <MetricItem>
          <MetricValue>{summary.manualRecords}</MetricValue>
          <MetricLabel>asientos manuales</MetricLabel>
        </MetricItem>
        <MetricItem>
          <MetricValue>{summary.projectedRecords}</MetricValue>
          <MetricLabel>asientos en previo</MetricLabel>
        </MetricItem>
        <MetricItem>
          <MetricValue>{summary.closedPeriods}</MetricValue>
          <MetricLabel>periodos cerrados</MetricLabel>
        </MetricItem>
      </MetricStrip>

      <SupportStrip>
        <SupportItem>
          <SupportLabel>Moneda funcional</SupportLabel>
          <SupportValue>{functionalCurrency}</SupportValue>
        </SupportItem>
        <SupportItem>
          <SupportLabel>Cuentas posteables</SupportLabel>
          <SupportValue>{postingAccountsCount}</SupportValue>
        </SupportItem>
        <SupportItem>
          <SupportLabel>Perfiles cargados</SupportLabel>
          <SupportValue>{postingProfilesCount}</SupportValue>
        </SupportItem>
        <Button onClick={onOpenSettings}>Abrir configuracion</Button>
      </SupportStrip>
    </HeaderActions>
  </Header>
);

const Header = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(420px, 0.95fr);
  gap: 20px;
  padding: 24px 0 20px;
  border-bottom: 2px solid #e1e5eb;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const HeaderCopy = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 680px;
`;

const Eyebrow = styled.span`
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #1677FF;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 2rem;
  line-height: 1.08;
  font-weight: 650;
  color: ${designSystemV2.colors.text.primary};
`;

const Body = styled.p`
  margin: 0;
  max-width: 56ch;
  font-size: 0.95rem;
  line-height: 1.65;
  color: ${designSystemV2.colors.text.secondary};
`;

const HeaderActions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const MetricStrip = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 18px;
  border: 1px solid #e1e5eb;
  border-left: 4px solid #1677FF;
  border-radius: 4px;
  background: ${designSystemV2.colors.background.surface};
`;

const MetricValue = styled.strong`
  font-size: 1.7rem;
  line-height: 1;
  font-weight: 650;
  color: ${designSystemV2.colors.text.primary};
`;

const MetricLabel = styled.span`
  font-size: 0.8rem;
  color: ${designSystemV2.colors.text.secondary};
`;

const SupportStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid #e1e5eb;
  border-radius: 4px;
  background: #f8f9fa;
`;

const SupportItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 120px;
`;

const SupportLabel = styled.span`
  font-size: 0.72rem;
  color: ${designSystemV2.colors.text.muted};
`;

const SupportValue = styled.strong`
  font-size: 0.92rem;
  color: ${designSystemV2.colors.text.primary};
`;
