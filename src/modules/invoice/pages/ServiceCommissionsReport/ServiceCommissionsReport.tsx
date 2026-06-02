import { ListBoxItem } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
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
import { TeamOutlined } from '@/constants/icons/antd';
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
  HeaderTools,
  ManageCollaboratorsButton,
  MutedText,
  Page,
  ReportTable,
  ReportTableContent,
  ReportTableFrame,
  ReportTableHeader,
  SummaryCard,
  SummaryGrid,
  SummaryLabel,
  SummaryValue,
  TableState,
  TableText,
  Title,
  TitleBlock,
} from './ServiceCommissionsReport.styles';
import {
  type CollaboratorOption,
  formatReportDate as formatDate,
  formatReportMoney as formatMoney,
  fromDateKey,
  getBusinessId,
  getCollaboratorLabel,
  getInvoiceLabel,
  getServiceLabel,
  toDateKey,
} from './utils/reportDisplay';

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
              Consolidado interno por rango de fecha, colaborador y facturas
              relacionadas.
            </Description>
          </TitleBlock>

          <HeaderTools>
            <ManageCollaboratorsButton
              variant="secondary"
              onPress={() =>
                navigate(ROUTES_NAME.HR_PAYROLL_TERM.HR_EMPLOYEES)
              }
            >
              <TeamOutlined />
              Gestionar en RRHH
            </ManageCollaboratorsButton>

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
            <SummaryLabel>Total vendido</SummaryLabel>
            <SummaryValue>{formatMoney(summary.totalSold)}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Total comisión</SummaryLabel>
            <SummaryValue>{formatMoney(summary.totalCommission)}</SummaryValue>
          </SummaryCard>
          <SummaryCard>
            <SummaryLabel>Servicios realizados</SummaryLabel>
            <SummaryValue>{summary.services}</SummaryValue>
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
                  <VmTable.Column>Vendido</VmTable.Column>
                  <VmTable.Column>Comisión</VmTable.Column>
                </ReportTableHeader>
                <VmTable.Body key={tableBodyStateKey}>
                  {loading ? (
                    <VmTable.Row key="loading" id="loading">
                      <VmTable.Cell colSpan={6}>
                        <TableState>
                          <VmSpinner size="sm" />
                          Cargando comisiones...
                        </TableState>
                      </VmTable.Cell>
                    </VmTable.Row>
                  ) : pagedRows.length === 0 ? (
                    <VmTable.Row key="empty" id="empty">
                      <VmTable.Cell colSpan={6}>
                        <TableState>
                          No hay comisiones para los filtros actuales.
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
                          <AmountCell>
                            {formatMoney(
                              Number(
                                row.billedAmount ?? row.amountFactured ?? 0,
                              ),
                            )}
                          </AmountCell>
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
