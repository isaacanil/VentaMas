import { Button, Input, Modal, Select, message } from 'antd';
import { useMemo, useState } from 'react';
import styled, { css } from 'styled-components';

import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  FileExcelOutlined,
  InfoCircleOutlined,
} from '@/constants/icons/antd';
import {
  formatAccountingMoney,
  formatAccountingPeriod,
} from '../utils/accountingWorkspace';
import { exportPeriodCloseWorkbook } from './utils/periodCloseExport';

import type { AccountingPeriodClosure } from '../utils/accountingWorkspace';

interface PeriodOption {
  amount: number;
  entries: number;
  label: string;
  periodKey: string;
  status: 'closed' | 'open';
}

interface PeriodClosePanelProps {
  closures: AccountingPeriodClosure[];
  closing: boolean;
  onClosePeriod: (periodKey: string, note?: string) => Promise<boolean>;
  periods: PeriodOption[];
}

const STATUS_COPY = {
  closed: {
    description: 'Bloqueado para nuevos movimientos.',
    label: 'Cerrado',
  },
  open: {
    description: 'Disponible para registrar y revisar.',
    label: 'Abierto',
  },
} as const;

const GUIDANCE_POINTS = [
  'Confirma ventas, cobros, gastos y pagos pendientes antes de bloquear el mes.',
  'Si falta una operacion, registrala en un periodo abierto o reabre el periodo luego del control.',
  'Usa la nota de cierre para dejar contexto fiscal, de auditoria o de aprobacion interna.',
];

const getInitialPeriodKey = (periods: PeriodOption[]) =>
  periods.find((period) => period.status === 'open')?.periodKey ??
  periods[0]?.periodKey ??
  '';

export const PeriodClosePanel = ({
  closures,
  closing,
  onClosePeriod,
  periods,
}: PeriodClosePanelProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState(() =>
    getInitialPeriodKey(periods),
  );
  const [note, setNote] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const sortedPeriods = useMemo(
    () =>
      periods
        .slice()
        .sort((left, right) => right.periodKey.localeCompare(left.periodKey)),
    [periods],
  );
  const sortedClosures = useMemo(
    () =>
      closures
        .slice()
        .sort((left, right) => right.periodKey.localeCompare(left.periodKey)),
    [closures],
  );

  const resolvedSelectedPeriod = useMemo(
    () =>
      sortedPeriods.find((period) => period.periodKey === selectedPeriod)
        ?.periodKey ??
      sortedPeriods.find((period) => period.status === 'open')?.periodKey ??
      sortedPeriods[0]?.periodKey ??
      '',
    [selectedPeriod, sortedPeriods],
  );

  const selectedPeriodData = useMemo(
    () =>
      sortedPeriods.find((period) => period.periodKey === resolvedSelectedPeriod) ??
      null,
    [resolvedSelectedPeriod, sortedPeriods],
  );
  const openPeriods = useMemo(
    () => sortedPeriods.filter((period) => period.status === 'open'),
    [sortedPeriods],
  );
  const closedPeriods = useMemo(
    () => sortedPeriods.filter((period) => period.status === 'closed'),
    [sortedPeriods],
  );
  const canCloseSelected = selectedPeriodData?.status === 'open';

  const handleClosePeriod = async () => {
    if (!resolvedSelectedPeriod) {
      return;
    }

    const closed = await onClosePeriod(
      resolvedSelectedPeriod,
      note.trim() || undefined,
    );

    if (closed) {
      setNote('');
      setModalOpen(false);
    }
  };

  const handleExport = async () => {
    if (!sortedPeriods.length) {
      void message.error('No hay periodos disponibles para exportar.');
      return;
    }

    setExporting(true);
    try {
      await exportPeriodCloseWorkbook({
        closures: sortedClosures,
        periods: sortedPeriods,
      });
      void message.success('Cierres contables exportados a Excel.');
    } catch (error) {
      console.error('Error exportando cierres contables:', error);
      void message.error('No se pudo exportar el archivo.');
    } finally {
      setExporting(false);
    }
  };

  if (!sortedPeriods.length) {
    return (
      <Panel>
        <SectionText>
          No hay periodos disponibles todavia para gestionar cierres.
        </SectionText>

        <EmptyState>
          <EmptyIcon>
            <InfoCircleOutlined />
          </EmptyIcon>
          <div>
            <EmptyTitle>Sin periodos cargados</EmptyTitle>
            <SectionText>
              Cuando existan movimientos contables por mes, podras revisar su
              estado y ejecutar el cierre desde aqui.
            </SectionText>
          </div>
        </EmptyState>
      </Panel>
    );
  }

  return (
    <Panel>
      <PeriodStrip>
        {selectedPeriodData ? (
          <>
            <StripLeft>
              <ClockCircleOutlined />
              <StripPeriodName>
                {formatAccountingPeriod(selectedPeriodData.periodKey)}
              </StripPeriodName>
              <StatusBadge $tone={selectedPeriodData.status}>
                {STATUS_COPY[selectedPeriodData.status].label}
              </StatusBadge>
            </StripLeft>
            <StripRight>
              <StripMetrics>
                <StripMetric>
                  <span>Movimientos</span>
                  <strong>{selectedPeriodData.entries}</strong>
                </StripMetric>
                <StripMetric>
                  <span>Acumulado</span>
                  <strong>{formatAccountingMoney(selectedPeriodData.amount)}</strong>
                </StripMetric>
                <StripDivider />
                <StripMetric>
                  <span>Abiertos</span>
                  <strong>{openPeriods.length}</strong>
                </StripMetric>
                <StripMetric>
                  <span>Cerrados</span>
                  <strong>{closedPeriods.length}</strong>
                </StripMetric>
              </StripMetrics>
              <Button
                icon={<FileExcelOutlined />}
                loading={exporting}
                onClick={() => {
                  void handleExport();
                }}
              >
                Exportar Excel
              </Button>
              <Button
                type="primary"
                disabled={!canCloseSelected}
                onClick={() => setModalOpen(true)}
              >
                Cerrar periodo
              </Button>
            </StripRight>
          </>
        ) : (
          <StripLeft>
            <StripPeriodName>Sin periodo activo</StripPeriodName>
          </StripLeft>
        )}
      </PeriodStrip>

      <HistorySection>
        <CardHeader>
          <CardTitle>Historial de cierres</CardTitle>
        </CardHeader>

        {sortedClosures.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <CheckCircleOutlined />
            </EmptyIcon>
            <div>
              <EmptyTitle>Aun no hay cierres registrados</EmptyTitle>
              <SectionText>
                Cuando cierres un periodo, aqui quedara el historial para
                consulta y control administrativo.
              </SectionText>
            </div>
          </EmptyState>
        ) : (
          <HistoryTableShell>
            <HistoryTable>
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Nota</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {sortedClosures.map((closure) => (
                  <tr key={closure.id}>
                    <td>{formatAccountingPeriod(closure.periodKey)}</td>
                    <td>{closure.note ?? 'Sin observacion'}</td>
                    <td>{closure.closedBy ?? 'Sistema'}</td>
                  </tr>
                ))}
              </tbody>
            </HistoryTable>
          </HistoryTableShell>
        )}
      </HistorySection>

      <Modal
        open={modalOpen}
        title="Cerrar periodo"
        onCancel={() => setModalOpen(false)}
        footer={null}
        width={440}
        destroyOnClose
      >
        <ModalBody>
          <FieldGroup>
            <FieldLabel>Periodo a cerrar</FieldLabel>
            <Select
              style={{ width: '100%' }}
              value={resolvedSelectedPeriod || undefined}
              placeholder="Selecciona un periodo"
              options={sortedPeriods.map((period) => ({
                label: `${period.label} · ${period.entries} movimientos`,
                value: period.periodKey,
              }))}
              onChange={setSelectedPeriod}
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Nota de cierre</FieldLabel>
            <Input
              type="text"
              placeholder="Ej. Cierre fiscal enviado a DGII"
              value={note}
              onChange={(event) => setNote(event.target.value)}
            />
          </FieldGroup>

          {!canCloseSelected && (
            <ActionNotice $tone="closed">
              <ActionNoticeTitle>Periodo protegido</ActionNoticeTitle>
              <ActionNoticeText>
                Este periodo ya fue cerrado. Si necesitas registrar mas
                operaciones, deberas reabrirlo.
              </ActionNoticeText>
            </ActionNotice>
          )}

          <ModalFooter>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button
              type="primary"
              loading={closing}
              disabled={!canCloseSelected}
              onClick={() => { void handleClosePeriod(); }}
            >
              Confirmar cierre
            </Button>
          </ModalFooter>
        </ModalBody>
      </Modal>
    </Panel>
  );
};

const Panel = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-5);
  padding: var(--ds-space-6) 0 var(--ds-space-8);
`;

const PeriodStrip = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--ds-space-4);
  padding: var(--ds-space-4) var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StripLeft = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-2);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-md);
`;

const StripPeriodName = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;

const StripMetrics = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-5);
`;

const StripRight = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ds-space-5);

  @media (max-width: 768px) {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }
`;

const StripMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 72px;

  span {
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
    text-transform: uppercase;
    letter-spacing: var(--ds-letter-spacing-wide);
    color: var(--ds-color-text-secondary);
  }

  strong {
    font-size: var(--ds-font-size-md);
    font-weight: var(--ds-font-weight-semibold);
    font-variant-numeric: tabular-nums;
    color: var(--ds-color-text-primary);
  }
`;

const StripDivider = styled.div`
  width: 1px;
  height: 32px;
  background: var(--ds-color-border-default);
  flex-shrink: 0;
`;

const SectionText = styled.p`
  max-width: 68ch;
  margin: 8px 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
`;

const HeaderStats = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: var(--ds-space-3);
  width: min(280px, 100%);
`;

const HeaderStat = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  padding: var(--ds-space-4) var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);

  span {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-medium);
  }

  strong {
    color: var(--ds-color-text-primary);
    font-size: var(--ds-font-size-2xl);
    font-variant-numeric: tabular-nums;
    line-height: 1.2;
  }
`;

const OverviewCard = styled.section`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(320px, 0.8fr);
  gap: var(--ds-space-4);
  padding: var(--ds-space-5) var(--ds-space-6);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const OverviewLead = styled.div`
  display: flex;
  gap: var(--ds-space-3);
`;

const OverviewIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 42px;
  height: 42px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-state-info-text);
`;

const OverviewTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
`;

const OverviewText = styled.p`
  margin: 6px 0 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
`;

const OverviewMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  min-height: 108px;
  padding: var(--ds-space-4);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const MetricLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const MetricValue = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-lg);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
  line-height: 1.35;
`;

const GuidanceCard = styled.section`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5) var(--ds-space-6);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const GuidanceHeader = styled.div`
  display: flex;
  gap: var(--ds-space-3);
`;

const GuidanceIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-state-info-subtle);
  color: var(--ds-color-state-info-text);
`;

const GuidanceTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
`;

const GuidanceList = styled.ul`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--ds-space-3);
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const GuidanceItem = styled.li`
  min-height: 92px;
  padding: var(--ds-space-4);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
`;

const ModalBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding-top: var(--ds-space-2);
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: var(--ds-space-2);
  padding-top: var(--ds-space-2);
  border-top: 1px solid var(--ds-color-border-subtle);
  margin-top: var(--ds-space-1);
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 480px);
  gap: var(--ds-space-4);
`;

const BaseCard = css`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-surface);
`;

const ActionCard = styled.section`
  ${BaseCard}
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-4);
`;

const PeriodsCard = styled.section`
  ${BaseCard}
`;

const CardHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const CardTitle = styled.h3`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;

const FieldGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
`;

const FieldLabel = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
`;

const FieldHint = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

const StatusBadge = styled.span<{ $tone: 'closed' | 'open' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
  min-height: 24px;
  padding: 0 var(--ds-space-2);
  border: 1px solid;
  border-radius: var(--ds-radius-md);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
  letter-spacing: var(--ds-letter-spacing-wide);
  text-transform: uppercase;
  line-height: 1;

  ${(props) =>
    props.$tone === 'closed'
      ? css`
          background: var(--ds-color-state-warning-subtle);
          border-color: var(--ds-color-state-warning);
          color: var(--ds-color-state-warning-text);
        `
      : css`
          background: var(--ds-color-bg-subtle);
          border-color: var(--ds-color-border-default);
          color: var(--ds-color-text-secondary);
        `}
`;

const ActionNotice = styled.div<{ $tone: 'closed' | 'open' }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-1);
  padding: var(--ds-space-4);
  border: 1px solid;
  border-radius: var(--ds-radius-lg);

  ${(props) =>
    props.$tone === 'closed'
      ? css`
          background: var(--ds-color-state-warning-subtle);
          border-color: var(--ds-color-state-warning);
        `
      : css`
          background: var(--ds-color-state-info-subtle);
          border-color: var(--ds-color-state-info);
        `}
`;

const ActionNoticeTitle = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-semibold);
`;

const ActionNoticeText = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-relaxed);
`;

const PeriodsList = styled.div`
  display: grid;
  gap: var(--ds-space-3);
`;

const PeriodButton = styled.button<{ $active: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ds-space-2);
  width: 100%;
  padding: var(--ds-space-4);
  border: 2px solid;
  border-radius: var(--ds-radius-lg);
  background: ${(props) =>
    props.$active
      ? 'var(--ds-color-interactive-selected-bg)'
      : 'var(--ds-color-bg-surface)'};
  border-color: ${(props) =>
    props.$active
      ? 'var(--ds-color-interactive-selected-border)'
      : 'var(--ds-color-border-default)'};
  cursor: pointer;
  text-align: left;

  &:hover {
    border-color: var(--ds-color-interactive-selected-border);
    background: var(--ds-color-interactive-selected-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--ds-color-border-focus);
    outline-offset: 2px;
  }
`;

const PeriodButtonHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--ds-space-3);
`;

const PeriodTitle = styled.strong`
  display: block;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
`;

const PeriodAmount = styled.strong`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  font-weight: var(--ds-font-weight-semibold);
  font-variant-numeric: tabular-nums;
`;

const PeriodMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  line-height: var(--ds-line-height-normal);
`;

const HistorySection = styled.section`
  ${BaseCard}
`;

const HistoryTableShell = styled.div`
  overflow-x: auto;
`;

const HistoryTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    padding: var(--ds-space-3) 0;
    border-bottom: 1px solid var(--ds-color-border-subtle);
    text-align: left;
    vertical-align: top;
  }

  th {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-xs);
    font-weight: var(--ds-font-weight-semibold);
    letter-spacing: var(--ds-letter-spacing-wide);
    text-transform: uppercase;
    border-bottom: 1px solid var(--ds-color-border-default);
  }

  td {
    color: var(--ds-color-text-secondary);
    font-size: var(--ds-font-size-sm);
    line-height: var(--ds-line-height-relaxed);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

const EmptyState = styled.div`
  display: flex;
  align-items: flex-start;
  gap: var(--ds-space-3);
  padding: var(--ds-space-5);
  border: 1px solid var(--ds-color-border-default);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-color-bg-subtle);
`;

const EmptyIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: var(--ds-radius-md);
  background: var(--ds-color-bg-surface);
  color: var(--ds-color-state-info-text);
`;

const EmptyTitle = styled.h4`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-md);
  line-height: var(--ds-line-height-tight);
  font-weight: var(--ds-font-weight-semibold);
`;
