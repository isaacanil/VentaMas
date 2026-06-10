import { ListBoxItem } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import { message } from 'antd';
import dayjs from 'dayjs';
import { useCallback, useMemo, useState } from 'react';
import type { Key } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PageLayout } from '@/components/layout/PageShell';
import {
  VmAlert,
  VmDateField,
  VmDateRangePicker,
  VmRangeCalendar,
  VmSelect,
  VmSpinner,
  VmTable,
} from '@/components/heroui';
import { FileExcelOutlined, TeamOutlined } from '@/constants/icons/antd';
import { useServiceCommissionCollaborators } from '@/firebase/commissions/useServiceCommissionCollaborators';
import { useServiceCommissionsReport } from '@/firebase/commissions/useServiceCommissionsReport';
import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';
import type { UserIdentity } from '@/types/users';
import { buildServiceCommissionCollaboratorOptions } from '@/utils/commissions/collaboratorOptions';

import { ReportPagination } from './components/ReportPagination';
import {
  AmountCell,
  CollaboratorListBox,
  CollaboratorSelect,
  CommissionCell,
  DateGroup,
  DateInputContainer,
  DateRangeControl,
  Description,
  ErrorAlert,
  ErrorDescription,
  ErrorTitle,
  FilterField,
  FilterLabel,
  Filters,
  Footer,
  FooterContent,
  FooterMeta,
  Header,
  HeaderActionButton,
  HeaderActions,
  HeaderTools,
  MutedText,
  Page,
  ReportTable,
  ReportTableContent,
  ReportTableFrame,
  ReportTableHeader,
  SummaryCard,
  SummaryGrid,
  SummaryHint,
  SummaryLabel,
  SummaryValue,
  TableState,
  TableText,
  TableTextStack,
  Title,
  TitleBlock,
  SmallMutedText,
} from './ServiceCommissionsReport.styles';
import {
  type CollaboratorOption,
  formatReportDate as formatDate,
  formatReportMoney as formatMoney,
  fromDateKey,
  getCommissionBaseLabel,
  getCommissionFormulaLabel,
  getCommissionRateLabel,
  getCommissionRuleLabel,
  getBusinessId,
  getCollaboratorLabel,
  getInvoiceLabel,
  getServiceLabel,
  toDateKey,
} from './utils/reportDisplay';
import { exportServiceCommissionsReportWorkbook } from './utils/serviceCommissionsReportExport';

const PAGE_SIZE = 20;
const ALL_COLLABORATORS_KEY = '__all__';

export const ServiceCommissionsReport = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = getBusinessId(user);
  const [range, setRange] = useState<[Date, Date]>(() => {
    const end = dayjs().endOf('day').toDate();
    const start = dayjs().subtract(30, 'day').startOf('day').toDate();
    return [start, end];
  });
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const { rows: collaborators, loading: collaboratorsLoading } =
    useServiceCommissionCollaborators(businessId);
  const { rows, loading, error } = useServiceCommissionsReport({
    businessId,
    collaboratorId,
    startDate: range[0],
    endDate: range[1],
  });

  const collaboratorOptions = useMemo(() => {
    return buildServiceCommissionCollaboratorOptions({
      collaborators,
    }).map(({ label, value }): CollaboratorOption => ({ label, value }));
  }, [collaborators]);
  const collaboratorFilterLoading = collaboratorsLoading;
  const summaryLoading = loading && rows.length === 0;

  const summary = useMemo(
    () =>
      rows.reduce(
        (acc, row) => ({
          totalSold:
            acc.totalSold + Number(row.billedAmount ?? row.amountFactured ?? 0),
          totalCommission:
            acc.totalCommission + Number(row.commissionAmount || 0),
          services: acc.services + 1,
        }),
        { totalSold: 0, totalCommission: 0, services: 0 },
      ),
    [rows],
  );

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedRows = useMemo(
    () =>
      rows.slice(
        (safeCurrentPage - 1) * PAGE_SIZE,
        safeCurrentPage * PAGE_SIZE,
      ),
    [rows, safeCurrentPage],
  );

  const handleCollaboratorChange = (key: Key | null) => {
    const nextValue = key ? String(key) : ALL_COLLABORATORS_KEY;
    setCurrentPage(1);
    setCollaboratorId(nextValue === ALL_COLLABORATORS_KEY ? null : nextValue);
  };

  const handleExportExcel = useCallback(async () => {
    if (!rows.length) {
      message.warning('No hay comisiones para exportar.');
      return;
    }

    setExporting(true);
    try {
      await exportServiceCommissionsReportWorkbook({
        endDate: range[1],
        rows,
        startDate: range[0],
      });
      message.success('Reporte de comisiones exportado a Excel.');
    } catch (exportError) {
      console.error(
        '[ServiceCommissionsReport] excel export failed',
        exportError,
      );
      message.error('No se pudo exportar el reporte de comisiones.');
    } finally {
      setExporting(false);
    }
  }, [range, rows]);

  const tableBodyStateKey = loading
    ? 'loading'
    : pagedRows.length === 0
      ? 'empty'
      : `rows-${safeCurrentPage}-${pagedRows.map((row) => row.id).join('-')}`;

  return (
    <PageLayout>
      <MenuApp
        sectionName="Comisiones de servicios"
        showNotificationButton
        onBackClick={() => navigate(ROUTES_NAME.SALES_TERM.BILLS)}
      />
      <Page>
        <Header>
          <TitleBlock>
            <Title>Comisiones de servicios</Title>
            <Description>
              Consolidado interno por rango de fecha, colaborador, base
              comisionable y regla aplicada.
            </Description>
          </TitleBlock>

          <HeaderTools>
            <HeaderActions>
              <HeaderActionButton
                variant="secondary"
                isDisabled={loading || exporting || rows.length === 0}
                onPress={() => void handleExportExcel()}
              >
                <FileExcelOutlined />
                {exporting ? 'Exportando...' : 'Exportar Excel'}
              </HeaderActionButton>

              <HeaderActionButton
                variant="secondary"
                onPress={() =>
                  navigate(ROUTES_NAME.HR_PAYROLL_TERM.HR_EMPLOYEES)
                }
              >
                <TeamOutlined />
                Configurar colaboradores
              </HeaderActionButton>
            </HeaderActions>

            <Filters>
              <FilterField>
                <FilterLabel>Rango de fecha</FilterLabel>
                <DateRangeControl
                  value={{
                    start: parseDate(toDateKey(range[0])),
                    end: parseDate(toDateKey(range[1])),
                  }}
                  onChange={(value) => {
                    if (!value?.start || !value?.end) return;
                    setCurrentPage(1);
                    setRange([
                      fromDateKey(value.start.toString(), 'start'),
                      fromDateKey(value.end.toString(), 'end'),
                    ]);
                  }}
                >
                  <DateGroup fullWidth>
                    <DateInputContainer>
                      <VmDateField.Input slot="start">
                        {(segment) => <VmDateField.Segment segment={segment} />}
                      </VmDateField.Input>
                      <VmDateRangePicker.RangeSeparator />
                      <VmDateField.Input slot="end">
                        {(segment) => <VmDateField.Segment segment={segment} />}
                      </VmDateField.Input>
                    </DateInputContainer>
                    <VmDateField.Suffix>
                      <VmDateRangePicker.Trigger>
                        <VmDateRangePicker.TriggerIndicator />
                      </VmDateRangePicker.Trigger>
                    </VmDateField.Suffix>
                  </DateGroup>
                  <VmDateRangePicker.Popover>
                    <VmRangeCalendar aria-label="Rango de comisiones">
                      <VmRangeCalendar.Header>
                        <VmRangeCalendar.YearPickerTrigger>
                          <VmRangeCalendar.YearPickerTriggerHeading />
                          <VmRangeCalendar.YearPickerTriggerIndicator />
                        </VmRangeCalendar.YearPickerTrigger>
                        <VmRangeCalendar.NavButton slot="previous" />
                        <VmRangeCalendar.NavButton slot="next" />
                      </VmRangeCalendar.Header>
                      <VmRangeCalendar.Grid>
                        <VmRangeCalendar.GridHeader>
                          {(day) => (
                            <VmRangeCalendar.HeaderCell>
                              {day}
                            </VmRangeCalendar.HeaderCell>
                          )}
                        </VmRangeCalendar.GridHeader>
                        <VmRangeCalendar.GridBody>
                          {(date) => <VmRangeCalendar.Cell date={date} />}
                        </VmRangeCalendar.GridBody>
                      </VmRangeCalendar.Grid>
                      <VmRangeCalendar.YearPickerGrid>
                        <VmRangeCalendar.YearPickerGridBody>
                          {({ year }) => (
                            <VmRangeCalendar.YearPickerCell year={year} />
                          )}
                        </VmRangeCalendar.YearPickerGridBody>
                      </VmRangeCalendar.YearPickerGrid>
                    </VmRangeCalendar>
                  </VmDateRangePicker.Popover>
                </DateRangeControl>
              </FilterField>

              <FilterField>
                <FilterLabel>Colaborador</FilterLabel>
                <CollaboratorSelect
                  aria-label="Filtrar por colaborador"
                  fullWidth
                  isDisabled={collaboratorFilterLoading}
                  selectedKey={collaboratorId ?? ALL_COLLABORATORS_KEY}
                  onSelectionChange={handleCollaboratorChange}
                >
                  <VmSelect.Trigger>
                    <VmSelect.Value />
                    <VmSelect.Indicator />
                  </VmSelect.Trigger>
                  <VmSelect.Popover>
                    <CollaboratorListBox aria-label="Colaboradores">
                      <ListBoxItem
                        key={ALL_COLLABORATORS_KEY}
                        id={ALL_COLLABORATORS_KEY}
                        textValue="Todos los colaboradores"
                      >
                        Todos los colaboradores
                        <ListBoxItem.Indicator />
                      </ListBoxItem>
                      {collaboratorOptions.map((option) => (
                        <ListBoxItem
                          key={option.value}
                          id={option.value}
                          textValue={option.label}
                        >
                          {option.label}
                          <ListBoxItem.Indicator />
                        </ListBoxItem>
                      ))}
                    </CollaboratorListBox>
                  </VmSelect.Popover>
                </CollaboratorSelect>
              </FilterField>
            </Filters>
          </HeaderTools>
        </Header>

        {error ? (
          <ErrorAlert status="danger">
            <VmAlert.Content>
              <ErrorTitle>
                No se pudo cargar el reporte de comisiones
              </ErrorTitle>
              <ErrorDescription>{error.message}</ErrorDescription>
            </VmAlert.Content>
          </ErrorAlert>
        ) : null}

        <SummaryGrid>
          <SummaryCard>
            <SummaryLabel>Base comisionable</SummaryLabel>
            <SummaryValue>
              {summaryLoading ? 'Cargando...' : formatMoney(summary.totalSold)}
            </SummaryValue>
            <SummaryHint>Subtotal sin ITBIS y después de descuentos.</SummaryHint>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Total comisión</SummaryLabel>
            <SummaryValue>
              {summaryLoading
                ? 'Cargando...'
                : formatMoney(summary.totalCommission)}
            </SummaryValue>
            <SummaryHint>Suma de comisiones visibles en el reporte.</SummaryHint>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Servicios realizados</SummaryLabel>
            <SummaryValue>
              {summaryLoading ? 'Cargando...' : summary.services}
            </SummaryValue>
            <SummaryHint>Servicios facturados dentro del rango.</SummaryHint>
          </SummaryCard>
        </SummaryGrid>

        <ReportTableFrame>
          <ReportTable>
            <VmTable.ScrollContainer>
              <ReportTableContent aria-label="Reporte de comisiones de servicios">
                <ReportTableHeader>
                  <VmTable.Column isRowHeader>Fecha</VmTable.Column>
                  <VmTable.Column>Factura</VmTable.Column>
                  <VmTable.Column>Servicio</VmTable.Column>
                  <VmTable.Column>Colaborador</VmTable.Column>
                  <VmTable.Column>Base</VmTable.Column>
                  <VmTable.Column>Tasa</VmTable.Column>
                  <VmTable.Column>Regla</VmTable.Column>
                  <VmTable.Column>Comisión</VmTable.Column>
                </ReportTableHeader>
                <VmTable.Body key={tableBodyStateKey}>
                  {loading ? (
                    <VmTable.Row key="loading" id="loading">
                      <VmTable.Cell colSpan={8}>
                        <TableState>
                          <VmSpinner size="sm" />
                          Cargando comisiones...
                        </TableState>
                      </VmTable.Cell>
                    </VmTable.Row>
                  ) : pagedRows.length === 0 ? (
                    <VmTable.Row key="empty" id="empty">
                      <VmTable.Cell colSpan={8}>
                        <TableState>
                          No hay comisiones para estos filtros. Revisa el
                          rango, el colaborador, la configuración activa o las
                          ventas facturadas.
                        </TableState>
                      </VmTable.Cell>
                    </VmTable.Row>
                  ) : (
                    pagedRows.map((row) => (
                      <VmTable.Row key={row.id} id={row.id}>
                        <VmTable.Cell>
                          <TableText>{formatDate(row.date)}</TableText>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <TableText>{getInvoiceLabel(row)}</TableText>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <TableText>{getServiceLabel(row)}</TableText>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <MutedText>{getCollaboratorLabel(row)}</MutedText>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <TableTextStack>
                            <AmountCell>
                              {formatMoney(
                                Number(
                                  row.billedAmount ?? row.amountFactured ?? 0,
                                ),
                              )}
                            </AmountCell>
                            <SmallMutedText>
                              {getCommissionBaseLabel(row)}
                            </SmallMutedText>
                          </TableTextStack>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <TableText>{getCommissionRateLabel(row)}</TableText>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <TableTextStack>
                            <TableText>{getCommissionRuleLabel(row)}</TableText>
                            <SmallMutedText>
                              {getCommissionFormulaLabel(row)}
                            </SmallMutedText>
                          </TableTextStack>
                        </VmTable.Cell>
                        <VmTable.Cell>
                          <CommissionCell>
                            {formatMoney(Number(row.commissionAmount || 0))}
                          </CommissionCell>
                        </VmTable.Cell>
                      </VmTable.Row>
                    ))
                  )}
                </VmTable.Body>
              </ReportTableContent>
            </VmTable.ScrollContainer>
            <Footer>
              <FooterContent>
                <FooterMeta>
                  {rows.length === 0
                    ? '0 registros'
                    : `${pagedRows.length} / ${rows.length} registros`}
                </FooterMeta>
                <ReportPagination
                  currentPage={safeCurrentPage}
                  setCurrentPage={setCurrentPage}
                  totalPages={totalPages}
                />
              </FooterContent>
            </Footer>
          </ReportTable>
        </ReportTableFrame>
      </Page>
    </PageLayout>
  );
};

export default ServiceCommissionsReport;
