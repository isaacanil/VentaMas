import {
  DashboardOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Input,
  InputNumber,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableColumnsType as ColumnsType } from 'antd';
import React, { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageShell } from '@/components/layout/PageShell';
import { selectUser } from '@/features/auth/userSlice';
import {
  fbAnalyzeFinanceReadiness,
  type AnalyzeFinanceReadinessResponse,
  type FinanceReadinessBusinessResult,
  type FinanceReadinessIssue,
  type FinanceReadinessModule,
  type FinanceReadinessStatus,
} from '@/firebase/accounting/fbAnalyzeFinanceReadiness';
import { MenuApp } from '@/modules/navigation/public';
import ROUTES_NAME from '@/router/routes/routesName';

const { Text, Title } = Typography;

const MODULE_LABELS: Record<
  keyof FinanceReadinessBusinessResult['modules'],
  string
> = {
  cxp: 'CxP',
  treasury: 'Banco y caja',
  currency: 'Moneda',
  accounting: 'Contabilidad',
};

const STATUS_LABELS: Record<FinanceReadinessStatus, string> = {
  ready: 'Listo',
  needs_preparation: 'Preparar',
  blocked: 'Bloqueado',
};

const STATUS_COLORS: Record<FinanceReadinessStatus, string> = {
  ready: 'success',
  needs_preparation: 'warning',
  blocked: 'error',
};

const formatValue = (value: unknown): string => {
  if (value == null) return '-';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  }
  if (typeof value === 'string') return value;
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  return JSON.stringify(value);
};

const statusTag = (status: FinanceReadinessStatus) => (
  <Tag color={STATUS_COLORS[status]}>{STATUS_LABELS[status]}</Tag>
);

const collectIssues = (
  modules: FinanceReadinessBusinessResult['modules'],
): Array<FinanceReadinessIssue & { moduleKey: string; moduleLabel: string }> =>
  Object.entries(modules).flatMap(([moduleKey, module]) =>
    module.issues.map((issue) => ({
      ...issue,
      moduleKey,
      moduleLabel:
        MODULE_LABELS[moduleKey as keyof FinanceReadinessBusinessResult['modules']],
    })),
  );

const FinanceReadinessAudit: React.FC = () => {
  const user = useSelector(selectUser);
  const navigate = useNavigate();
  const activeBusinessId: string =
    user?.businessID ?? user?.activeBusinessId ?? '';
  const [businessIdInput, setBusinessIdInput] = useState('');
  const [maxDocuments, setMaxDocuments] = useState<number | null>(300);
  const [loading, setLoading] = useState(false);
  const [result, setResult] =
    useState<AnalyzeFinanceReadinessResponse | null>(null);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    null,
  );

  const businessRows = result?.businessResults ?? [];
  const selectedBusiness =
    businessRows.find((row) => row.businessId === selectedBusinessId) ??
    businessRows[0] ??
    null;
  const selectedIssues = selectedBusiness
    ? collectIssues(selectedBusiness.modules)
    : [];
  const effectiveBusinessId = businessIdInput.trim() || activeBusinessId;

  const columns: ColumnsType<FinanceReadinessBusinessResult> = useMemo(
    () => [
      {
        title: 'Negocio',
        dataIndex: 'businessName',
        key: 'businessName',
        render: (_, row) => (
          <BusinessCell>
            <strong>{row.businessName}</strong>
            <Text type="secondary">{row.businessId}</Text>
          </BusinessCell>
        ),
      },
      {
        title: 'Estado',
        dataIndex: 'status',
        key: 'status',
        width: 130,
        render: (status: FinanceReadinessStatus) => statusTag(status),
      },
      {
        title: 'Bloqueos',
        dataIndex: ['issueCounts', 'blockers'],
        key: 'blockers',
        width: 110,
      },
      {
        title: 'Alertas',
        dataIndex: ['issueCounts', 'warnings'],
        key: 'warnings',
        width: 110,
      },
      {
        title: 'Módulos',
        key: 'modules',
        render: (_, row) => (
          <ModuleTags>
            {Object.entries(row.modules).map(([key, module]) => (
              <Tag key={key} color={STATUS_COLORS[module.status]}>
                {MODULE_LABELS[
                  key as keyof FinanceReadinessBusinessResult['modules']
                ]}
              </Tag>
            ))}
          </ModuleTags>
        ),
      },
    ],
    [],
  );

  const runAnalysis = async (allBusinesses: boolean) => {
    const businessId = allBusinesses ? 'ALL' : effectiveBusinessId;
    if (!allBusinesses && !businessId) {
      message.warning('Selecciona un negocio para analizar.');
      return;
    }

    setLoading(true);
    try {
      const response = await fbAnalyzeFinanceReadiness({
        businessId,
        allBusinesses,
        maxDocuments: maxDocuments ?? 300,
      });
      setResult(response);
      setSelectedBusinessId(response.businessResults[0]?.businessId ?? null);
      message.success('Análisis completado.');
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      message.error(errorMessage || 'No se pudo ejecutar el análisis.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Wrapper>
      <MenuApp
        sectionName="Preparación financiera"
        showBackButton
        onBackClick={() => navigate(ROUTES_NAME.BASIC_TERM.DEVELOPER_HUB)}
      />

      <Content>
        <Header>
          <HeaderCopy>
            <Title level={3}>Estado de datos para rollout financiero</Title>
            <Text>
              Auditoría read-only para CxP, banco, caja, moneda y contabilidad
              antes de activar Cloud Functions nuevas.
            </Text>
          </HeaderCopy>
          <SafetyBadge>
            <SafetyCertificateOutlined />
            Solo lectura
          </SafetyBadge>
        </Header>

        <Toolbar>
          <Input
            allowClear
            value={businessIdInput}
            onChange={(event) => setBusinessIdInput(event.target.value)}
            placeholder={activeBusinessId || 'businessId'}
            addonBefore="Negocio"
          />
          <InputNumber
            min={50}
            max={1000}
            step={50}
            value={maxDocuments}
            onChange={(value) =>
              setMaxDocuments(typeof value === 'number' ? value : null)
            }
            addonBefore="Docs"
          />
          <Button
            type="primary"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => runAnalysis(false)}
          >
            Analizar negocio
          </Button>
          <Button
            icon={<DashboardOutlined />}
            loading={loading}
            onClick={() => runAnalysis(true)}
          >
            Analizar todos
          </Button>
        </Toolbar>

        <Alert
          type="info"
          showIcon
          message="Esta herramienta no prepara ni corrige datos."
          description="Solo muestra qué bloquearía o requeriría preparación antes de actualizar funciones productivas."
        />

        {result ? (
          <>
            <SummaryGrid>
              <SummaryItem>
                <span>Listos</span>
                <strong>{result.summary.ready}</strong>
              </SummaryItem>
              <SummaryItem>
                <span>Preparar</span>
                <strong>{result.summary.needs_preparation}</strong>
              </SummaryItem>
              <SummaryItem>
                <span>Bloqueados</span>
                <strong>{result.summary.blocked}</strong>
              </SummaryItem>
              <SummaryItem>
                <span>Problemas</span>
                <strong>
                  {result.summary.blockers + result.summary.warnings}
                </strong>
              </SummaryItem>
            </SummaryGrid>

            <MainGrid>
              <Panel>
                <PanelHeader>
                  <strong>Negocios analizados</strong>
                  <Text type="secondary">{result.runId}</Text>
                </PanelHeader>
                <Table<FinanceReadinessBusinessResult>
                  rowKey="businessId"
                  size="small"
                  columns={columns}
                  dataSource={businessRows}
                  pagination={{ pageSize: 10 }}
                  onRow={(row) => ({
                    onClick: () => setSelectedBusinessId(row.businessId),
                  })}
                />
              </Panel>

              <Panel>
                <PanelHeader>
                  <strong>Detalle</strong>
                  {selectedBusiness ? statusTag(selectedBusiness.status) : null}
                </PanelHeader>
                {selectedBusiness ? (
                  <>
                    <ModuleGrid>
                      {Object.entries(selectedBusiness.modules).map(
                        ([key, module]) => (
                          <ModuleBox
                            key={key}
                            moduleKey={key}
                            module={module}
                          />
                        ),
                      )}
                    </ModuleGrid>

                    <IssueList>
                      {selectedIssues.length ? (
                        selectedIssues.map((issue) => (
                          <IssueRow
                            key={`${issue.moduleKey}-${issue.code}-${issue.collection ?? ''}-${issue.documentId ?? ''}`}
                          >
                            <WarningOutlined />
                            <IssueBody>
                              <IssueTitle>
                                <Tag
                                  color={
                                    issue.severity === 'blocker'
                                      ? 'error'
                                      : 'warning'
                                  }
                                >
                                  {issue.severity === 'blocker'
                                    ? 'Bloqueo'
                                    : 'Alerta'}
                                </Tag>
                                <strong>{issue.moduleLabel}</strong>
                                <Text code>{issue.code}</Text>
                              </IssueTitle>
                              <span>{issue.message}</span>
                              {issue.collection || issue.documentId ? (
                                <Text type="secondary">
                                  {issue.collection ?? '-'} /{' '}
                                  {issue.documentId ?? '-'}
                                </Text>
                              ) : null}
                            </IssueBody>
                          </IssueRow>
                        ))
                      ) : (
                        <EmptyState>No hay problemas en la muestra.</EmptyState>
                      )}
                    </IssueList>
                  </>
                ) : (
                  <EmptyState>Ejecuta un análisis para ver detalles.</EmptyState>
                )}
              </Panel>
            </MainGrid>
          </>
        ) : null}
      </Content>
    </Wrapper>
  );
};

const ModuleBox: React.FC<{
  moduleKey: string;
  module: FinanceReadinessModule;
}> = ({ moduleKey, module }) => (
  <ModuleCard>
    <ModuleCardHeader>
      <strong>
        {
          MODULE_LABELS[
            moduleKey as keyof FinanceReadinessBusinessResult['modules']
          ]
        }
      </strong>
      {statusTag(module.status)}
    </ModuleCardHeader>
    <MetricList>
      {Object.entries(module.metrics).map(([key, value]) => (
        <MetricItem key={key}>
          <span>{key}</span>
          <strong>{formatValue(value)}</strong>
        </MetricItem>
      ))}
    </MetricList>
  </ModuleCard>
);

export default FinanceReadinessAudit;

const Wrapper = styled(PageShell)``;

const Content = styled.main`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  width: min(1280px, 100%);
  margin: 0 auto;
  padding: var(--ds-space-6);
`;

const Header = styled.header`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-4);

  @media (max-width: 820px) {
    flex-direction: column;
  }
`;

const HeaderCopy = styled.div`
  display: grid;
  gap: var(--ds-space-2);

  h3 {
    margin: 0;
  }
`;

const SafetyBadge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: var(--ds-space-2);
  padding: var(--ds-space-2) var(--ds-space-3);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-primary);
  background: var(--ds-color-bg-surface);
  font-weight: var(--ds-font-weight-semibold);
`;

const Toolbar = styled.div`
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 150px auto auto;
  gap: var(--ds-space-3);
  align-items: center;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryGrid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 860px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const SummaryItem = styled.div`
  display: grid;
  gap: var(--ds-space-1);
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-xl);
  }
`;

const MainGrid = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
  gap: var(--ds-space-4);

  @media (max-width: 1100px) {
    grid-template-columns: 1fr;
  }
`;

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  min-width: 0;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const BusinessCell = styled.div`
  display: grid;
  gap: 2px;
`;

const ModuleTags = styled(Space)`
  flex-wrap: wrap;
`;

const ModuleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

const ModuleCard = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-bg-subtle);
`;

const ModuleCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
`;

const MetricList = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);

  strong {
    color: var(--ds-color-text-primary);
    font-weight: var(--ds-font-weight-semibold);
  }
`;

const IssueList = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const IssueRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--ds-space-3);
  padding: var(--ds-space-3);
  border: 1px solid var(--ds-color-border-subtle);
  border-radius: var(--ds-radius-sm);
  background: var(--ds-color-bg-surface);
`;

const IssueBody = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const IssueTitle = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ds-space-2);
`;

const EmptyState = styled.div`
  padding: var(--ds-space-5);
  border: 1px dashed var(--ds-color-border-default);
  border-radius: var(--ds-radius-md);
  color: var(--ds-color-text-secondary);
  text-align: center;
`;
