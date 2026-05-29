import { ListBox, ListBoxItem } from '@heroui/react';
import { parseDate } from '@internationalized/date';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';
import type { Dispatch, Key, SetStateAction } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { PageLayout, PageShell } from '@/components/layout/PageShell';
import {
  VmAlert,
  VmButton,
  VmCard,
  VmDateField,
  VmDateRangePicker,
  VmLabel,
  VmModal,
  VmPagination,
  VmRangeCalendar,
  VmSelect,
  VmSpinner,
  VmTable,
} from '@/components/heroui';
import { TeamOutlined } from '@/constants/icons/antd';
import { useServiceCommissionCollaborators } from '@/firebase/commissions/useServiceCommissionCollaborators';
import { useServiceCommissionsReport } from '@/firebase/commissions/useServiceCommissionsReport';
import { useBusinessUsers } from '@/firebase/users/useBusinessUsers';
import { selectUser } from '@/features/auth/userSlice';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';
import ROUTES_NAME from '@/router/routes/routesName';
import type { ServiceCommissionRecord } from '@/types/commissions';
import type { UserIdentity } from '@/types/users';
import { buildServiceCommissionCollaboratorOptions } from '@/utils/commissions/collaboratorOptions';
import { formatPriceByCurrency } from '@/utils/format';

import CollaboratorsManager from './components/CollaboratorsManager/CollaboratorsManager';

const PAGE_SIZE = 20;
const ALL_COLLABORATORS_KEY = '__all__';

type BusinessUser = Record<string, unknown> & {
  id?: string;
  uid?: string;
  number?: number;
};

type CollaboratorOption = {
  label: string;
  value: string;
};

const Page = styled(PageShell)`
  display: grid;
  grid-auto-rows: max-content;
  gap: var(--ds-space-5);
  padding: var(--ds-space-5);
  overflow-y: auto;
  background: var(--ds-color-bg-page);
`;

const Header = styled.header`
  display: flex;
  gap: var(--ds-space-4);
  align-items: flex-start;
  justify-content: space-between;

  @media (max-width: 860px) {
    flex-direction: column;
  }
`;

const HeaderTools = styled.div`
  display: grid;
  gap: var(--ds-space-3);
  justify-items: end;

  @media (max-width: 860px) {
    justify-items: stretch;
    width: 100%;
  }
`;

const ManageCollaboratorsButton = styled(VmButton)`
  justify-self: end;

  @media (max-width: 860px) {
    justify-self: stretch;
  }
`;

const TitleBlock = styled.div`
  display: grid;
  gap: var(--ds-space-1);
`;

const Title = styled.h1`
  margin: 0;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const Description = styled.p`
  margin: 0;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(280px, 360px) minmax(220px, 280px);
  gap: var(--ds-space-3);
  justify-content: flex-end;

  @media (max-width: 860px) {
    grid-template-columns: minmax(0, 1fr);
    width: 100%;
  }
`;

const FilterField = styled.div`
  display: grid;
  gap: var(--ds-space-2);
`;

const FilterLabel = styled(VmLabel)`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-xs);
  font-weight: var(--ds-font-weight-medium);
`;

const DateRangeControl = styled(VmDateRangePicker)`
  width: 100%;
`;

const DateGroup = styled(VmDateField.Group)`
  min-height: 38px;
`;

const DateInputContainer = styled(VmDateField.InputContainer)`
  min-width: 0;
`;

const CollaboratorSelect = styled(VmSelect)`
  width: 100%;
`;

const CollaboratorListBox = styled(ListBox)`
  min-width: 260px;
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: var(--ds-space-4);

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled(VmCard)`
  padding: var(--ds-space-4);
`;

const SummaryLabel = styled.div`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
  line-height: var(--ds-line-height-normal);
`;

const SummaryValue = styled.div`
  margin-top: var(--ds-space-2);
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-xl);
  font-weight: var(--ds-font-weight-semibold);
  line-height: var(--ds-line-height-tight);
`;

const ReportTableFrame = styled(VmCard)`
  min-width: 0;
  overflow: hidden;
`;

const ReportTable = styled(VmTable)`
  width: 100%;
`;

const ReportTableContent = styled(VmTable.Content)`
  min-width: 900px;
`;

const ReportTableHeader = styled(VmTable.Header)`
  background: var(--ds-color-bg-subtle);
`;

const TableText = styled.span`
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
`;

const MutedText = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const AmountCell = styled.span`
  display: block;
  color: var(--ds-color-text-primary);
  font-size: var(--ds-font-size-sm);
  font-weight: var(--ds-font-weight-medium);
  text-align: right;
`;

const CommissionCell = styled(AmountCell)`
  color: var(--ds-color-state-success-text);
`;

const TableState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--ds-space-2);
  min-height: 96px;
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const Footer = styled(VmTable.Footer)`
  border-top: 1px solid var(--ds-color-border-subtle);
`;

const FooterContent = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ds-space-3);
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const FooterMeta = styled.span`
  color: var(--ds-color-text-secondary);
  font-size: var(--ds-font-size-sm);
`;

const ErrorAlert = styled(VmAlert)`
  border-color: var(--ds-color-state-danger);
  background: var(--ds-color-state-danger-subtle);
`;

const ErrorTitle = styled(VmAlert.Title)`
  color: var(--ds-color-state-danger-text);
`;

const ErrorDescription = styled(VmAlert.Description)`
  color: var(--ds-color-text-primary);
`;

const toCleanString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toMillis = (value: unknown): number | null => {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === 'object') {
    const record = value as {
      seconds?: number;
      toDate?: () => Date;
      toMillis?: () => number;
    };
    if (typeof record.toMillis === 'function') return record.toMillis();
    if (typeof record.toDate === 'function') return record.toDate().getTime();
    if (typeof record.seconds === 'number') return record.seconds * 1000;
  }
  return null;
};

const formatDate = (value: unknown): string => {
  const millis = toMillis(value);
  return millis ? dayjs(millis).format('DD/MM/YYYY') : 'N/A';
};

const toDateKey = (date: Date): string => dayjs(date).format('YYYY-MM-DD');

const fromDateKey = (dateKey: string, boundary: 'start' | 'end'): Date => {
  const value = dayjs(dateKey);
  return boundary === 'start'
    ? value.startOf('day').toDate()
    : value.endOf('day').toDate();
};

const getBusinessId = (user: UserIdentity | null): string | null =>
  toCleanString(user?.businessID) ??
  toCleanString(user?.businessId) ??
  toCleanString(user?.activeBusinessId);

const getUserOption = (user: BusinessUser): CollaboratorOption | null => {
  const id =
    toCleanString(user.id) ??
    toCleanString(user.uid) ??
    toCleanString(user.number);
  const code =
    toCleanString(user.number) ??
    toCleanString(user.code) ??
    toCleanString(user.employeeCode) ??
    id;
  const name =
    toCleanString(user.name) ??
    toCleanString(user.displayName) ??
    toCleanString(user.fullName) ??
    toCleanString(user.email) ??
    code;
  if (!id && !code) return null;
  return {
    value: id ?? code,
    label: name && code && name !== code ? `${code} · ${name}` : (code ?? name),
  };
};

const getInvoiceLabel = (row: ServiceCommissionRecord): string =>
  toCleanString(row.invoiceNumber) ?? toCleanString(row.invoiceId) ?? 'Factura';

const getServiceLabel = (row: ServiceCommissionRecord): string =>
  toCleanString(row.serviceName) ??
  toCleanString(row.service?.name) ??
  'Servicio';

const getCollaboratorLabel = (row: ServiceCommissionRecord): string => {
  const code =
    toCleanString(row.collaboratorCode) ??
    toCleanString(row.collaborator?.code) ??
    null;
  const name = toCleanString(row.collaboratorName) ?? null;
  if (code && name) return `${code} · ${name}`;
  return code ?? name ?? 'N/A';
};

const formatMoney = (amount: number): string =>
  formatPriceByCurrency(amount, 'DOP');

const getVisiblePages = (currentPage: number, totalPages: number) =>
  Array.from({ length: totalPages }, (_, index) => index + 1).filter(
    (page) =>
      page === 1 ||
      page === totalPages ||
      (page >= currentPage - 1 && page <= currentPage + 1),
  );

const ReportPagination = ({
  currentPage,
  setCurrentPage,
  totalPages,
}: {
  currentPage: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  totalPages: number;
}) => {
  if (totalPages <= 1) return <FooterMeta>Pagina 1 de 1</FooterMeta>;

  const visiblePages = getVisiblePages(currentPage, totalPages);

  return (
    <VmPagination aria-label="Paginacion del reporte de comisiones">
      <VmPagination.Content>
        <VmPagination.Item>
          <VmPagination.Previous
            isDisabled={currentPage === 1}
            onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            <VmPagination.PreviousIcon />
          </VmPagination.Previous>
        </VmPagination.Item>
        {visiblePages.flatMap((page, index) => {
          const previous = visiblePages[index - 1];
          const showGap = previous && page - previous > 1;
          const items = [];

          if (showGap) {
            items.push(
              <VmPagination.Item key={`gap-${page}`}>
                <VmPagination.Ellipsis />
              </VmPagination.Item>,
            );
          }

          items.push(
            <VmPagination.Item key={`page-${page}`}>
              <VmPagination.Link
                isActive={page === currentPage}
                onPress={() => setCurrentPage(page)}
              >
                {page}
              </VmPagination.Link>
            </VmPagination.Item>,
          );

          return items;
        })}
        <VmPagination.Item>
          <VmPagination.Next
            isDisabled={currentPage === totalPages}
            onPress={() =>
              setCurrentPage((page) => Math.min(totalPages, page + 1))
            }
          >
            <VmPagination.NextIcon />
          </VmPagination.Next>
        </VmPagination.Item>
      </VmPagination.Content>
    </VmPagination>
  );
};

export const ServiceCommissionsReport = () => {
  const navigate = useNavigate();
  const user = useSelector(selectUser) as UserIdentity | null;
  const businessId = getBusinessId(user);
  const userId = toCleanString(user?.uid) ?? toCleanString(user?.id);
  const [range, setRange] = useState<[Date, Date]>(() => {
    const end = dayjs().endOf('day').toDate();
    const start = dayjs().subtract(30, 'day').startOf('day').toDate();
    return [start, end];
  });
  const [collaboratorId, setCollaboratorId] = useState<string | null>(null);
  const [collaboratorsOpen, setCollaboratorsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { users, loading: usersLoading } = useBusinessUsers() as {
    users: BusinessUser[];
    loading: boolean;
  };
  const { rows: collaborators, loading: collaboratorsLoading } =
    useServiceCommissionCollaborators(businessId);
  const { rows, loading, error } = useServiceCommissionsReport({
    businessId,
    collaboratorId,
    startDate: range[0],
    endDate: range[1],
  });

  const collaboratorOptions = useMemo(() => {
    const options = new Map<string, CollaboratorOption>();
    buildServiceCommissionCollaboratorOptions({
      collaborators,
      users,
    })
      .map(({ label, value }) => ({ label, value }))
      .forEach((option) => {
        options.set(option.value, option);
      });
    users
      .map(getUserOption)
      .filter((option): option is CollaboratorOption => Boolean(option))
      .forEach((option) => {
        if (!options.has(option.value)) options.set(option.value, option);
      });
    return Array.from(options.values());
  }, [collaborators, users]);
  const collaboratorFilterLoading = usersLoading || collaboratorsLoading;

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
              onPress={() => setCollaboratorsOpen(true)}
            >
              <TeamOutlined />
              Crear colaborador
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
      <VmModal
        title="Crear colaborador"
        ariaLabel="Crear colaborador de comisiones"
        isOpen={collaboratorsOpen}
        onOpenChange={setCollaboratorsOpen}
        size="lg"
        footer={
          <VmButton
            variant="primary"
            onPress={() => setCollaboratorsOpen(false)}
          >
            Listo
          </VmButton>
        }
      >
        <CollaboratorsManager businessId={businessId} userId={userId} />
      </VmModal>
    </PageLayout>
  );
};

export default ServiceCommissionsReport;
