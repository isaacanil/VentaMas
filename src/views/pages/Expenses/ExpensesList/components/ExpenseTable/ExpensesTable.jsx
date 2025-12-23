/**
 * @file ExpensesTable.jsx
 * @desc A component that renders a table of expenses.
 * @version 0.1.0
 * @since 0.1.0
 */

import { Alert, message } from 'antd';
import { DateTime } from 'luxon';
import { useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';


import { selectUser } from '@/features/auth/userSlice';
import {
  setExpense,
  setExpenseMode,
} from '@/features/expense/expenseManagementSlice';
import { openExpenseFormModal } from '@/features/expense/expenseUISlice';
import { toggleImageViewer } from '@/features/imageViewer/imageViewerSlice';
import { fbDeleteExpense } from '@/firebase/expenses/Items/fbDeleteExpense';
import { useFbGetExpenses } from '@/firebase/expenses/Items/useFbGetExpenses';
import { convertMillisToDate } from '@/hooks/useFormatTime';
import { formatPrice } from '@/utils/format';
import { truncateString } from '@/utils/text/truncateString';
import { ExpenseChart } from '@/views/pages/Expenses/ExpensesList/components/ExpenseReport/ExpenseReport';
import { AdvancedTable } from '@/views/templates/system/AdvancedTable/AdvancedTable';
import { Button } from '@/views/templates/system/Button/Button';
import { EditDelBtns } from '@/views/templates/system/Button/EditDelBtns/EditDelBtns';

import { FilterExpenses } from '../FilterBar/FilterExpenses';


const FIREBASE_INDEX_LINK_REGEX =
  /(https:\/\/console\.firebase\.google\.com\/[^\s"'`]+)/i;

const extractFirebaseIndexLink = (error) => {
  if (!error) return null;

  const candidates = [
    error?.link,
    error?.customData?.link,
    error?.customData?.path,
    error?.message,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;
    const match = candidate.match(FIREBASE_INDEX_LINK_REGEX);
    if (match?.[1]) {
      return match[1].replace(/[)>.,]+$/, '');
    }
  }

  return null;
};

const buildExpensesErrorDetails = (error) => {
  if (!error) return null;

  const code = typeof error?.code === 'string' ? error.code.toLowerCase() : '';
  const message = typeof error?.message === 'string' ? error.message : '';
  const requiresIndex =
    code.includes('failed-precondition') && /requires an index/i.test(message);

  if (requiresIndex) {
    return {
      type: 'index',
      title: 'Firebase necesita un índice para esta consulta',
      description:
        'Abre el asistente en la consola de Firebase para crear el índice que permite filtrar por fecha.',
      indexUrl: extractFirebaseIndexLink(error),
    };
  }

  return {
    type: 'generic',
    title: 'No se pudieron cargar los gastos',
    description:
      'Recarga la pantalla o contacta a soporte si el problema persiste.',
  };
};

const normalizeExpenseStatus = (status) =>
  typeof status === 'string' && status.trim() ? status : 'active';

/**
 * @function ExpensesTable
 * @desc A component that renders a table of expenses.
 * @returns {JSX.Element} The ExpensesTable component
 */
export const ExpensesTable = ({ searchTerm = '' }) => {
  const user = useSelector(selectUser);
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });
  const { expenses, loading, error } = useFbGetExpenses(dateRange);
  const errorDetails = useMemo(() => buildExpensesErrorDetails(error), [error]);

  const [reportIsOpen, setReportIsOpen] = useState(false);
  const handleReportOpen = () => setReportIsOpen(!reportIsOpen);

  const [filters, setFilters] = useState({});

  const handleFilterChange = useCallback(
    (newFilters) => {
      setFilters(newFilters);

      const newDateRange = newFilters.dateRange;
      if (newDateRange) {
        try {
          const startDate = newDateRange.startDate;
          const endDate = newDateRange.endDate;

          if (
            startDate !== dateRange?.startDate ||
            endDate !== dateRange?.endDate
          ) {
            setDateRange({
              startDate,
              endDate,
            });
          }
        } catch (error) {
          console.error('Error processing date range:', error);
        }
      } else {
        if (dateRange.startDate || dateRange.endDate) {
          setDateRange({ startDate: null, endDate: null });
        }
      }
    },
    [dateRange],
  );

  const normalizedExpenses = Array.isArray(expenses) ? expenses : [];
  const categories = [
    ...new Set(normalizedExpenses.map(({ expense }) => expense?.category)),
  ].filter(Boolean);
  const categoryOptions = categories.map((category) => ({
    label: category,
    value: category,
  }));


  const data = normalizedExpenses
    .map(({ expense: rawExpense }) => {
      const expense = rawExpense ?? {};
      const normalizedStatus = normalizeExpenseStatus(expense.status);
      const normalizedExpense = {
        ...expense,
        status: normalizedStatus,
      };

      let receiptImageUrl = null;
      const attachments = Array.isArray(expense.attachments)
        ? expense.attachments
        : [];
      if (attachments.length > 0) {
        const firstAttachment = attachments[0];
        if (
          firstAttachment?.url &&
          typeof firstAttachment.url === 'object' &&
          firstAttachment.url.url
        ) {
          receiptImageUrl = firstAttachment.url.url;
        } else if (typeof firstAttachment?.url === 'string') {
          receiptImageUrl = firstAttachment.url;
        }
      } else if (typeof expense.receiptImageUrl === 'string') {
        receiptImageUrl = expense.receiptImageUrl;
      }

      const createdAt = Number.isFinite(expense?.dates?.createdAt)
        ? expense.dates.createdAt
        : null;
      const expenseDate = Number.isFinite(expense?.dates?.expenseDate)
        ? expense.dates.expenseDate
        : createdAt;

      const amount = Number.isFinite(expense?.amount)
        ? expense.amount
        : Number(expense?.amount) || 0;

      const number = Number.isFinite(expense?.numberId)
        ? expense.numberId
        : Number(expense?.number) || 0;

      return {
        id: expense.id ?? normalizedExpense.id,
        number,
        category: expense.category,
        description: expense.description,
        dateExpense: expenseDate,
        amount,
        receiptImg: receiptImageUrl,
        attachments,
        action: normalizedExpense,
        status: normalizedStatus,
        createdAt,
        dateGroup: createdAt
          ? DateTime.fromMillis(createdAt).toLocaleString(DateTime.DATE_FULL)
          : 'Fecha sin registrar',
      };
    })

    .filter((item) => {
      if (filters.category && item.category !== filters.category) return false;

      if (filters.status && item.status !== filters.status) return false;

      if (searchTerm && searchTerm.trim() !== '') {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (item.category &&
            item.category.toLowerCase().includes(searchLower)) ||
          (item.description &&
            item.description.toLowerCase().includes(searchLower)) ||
          String(item.number).includes(searchLower) ||
          String(item.amount).includes(searchLower);
        if (!matchesSearch) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      const valueA = Number.isFinite(a.number)
        ? a.number
        : Number.MIN_SAFE_INTEGER;
      const valueB = Number.isFinite(b.number)
        ? b.number
        : Number.MIN_SAFE_INTEGER;
      return valueB - valueA;
    });

  const columns = [
    {
      Header: '#',
      accessor: 'number',
      minWidth: '50px',
      maxWidth: '50px',
      reorderable: false,
      sortable: true,
    },
    {
      Header: 'Descripción',
      accessor: 'description',
      minWidth: '60px',
      maxWidth: '1fr',
      cell: ({ value }) => truncateString(value, 18),
    },
    {
      Header: 'Categoría',
      accessor: 'category',
      minWidth: '50px',
      maxWidth: '1fr',
    },
    {
      Header: 'Fecha de Gasto',
      accessor: 'dateExpense',
      minWidth: '50px',
      maxWidth: '1fr',
      cell: ({ value }) => convertMillisToDate(value),
    },
    {
      Header: 'Importe',
      accessor: 'amount',
      minWidth: '50px',
      maxWidth: '1fr',
      cell: ({ value }) => formatPrice(value)
    },
    {
      Header: 'Recibo',
      accessor: 'receiptImg',
      minWidth: '70px',
      maxWidth: '70px',
      cell: ({ value }) => {
        const handleClick = () => {
          if (value) {
            dispatch(toggleImageViewer({ show: true, url: value }));
          } else {
            message.warning('Este gasto no tiene imágenes adjuntas');
          }
        };
        return <Button title="Ver" onClick={handleClick} />;
      },
    },
    {
      Header: 'Acción',
      accessor: 'action',
      minWidth: '80px',
      maxWidth: '70px',
      align: 'right',
      reorderable: false,
      cell: ({ value }) => {
        const handleUpdate = async () => {
          dispatch(setExpense(value));
          dispatch(setExpenseMode('update'));
          dispatch(openExpenseFormModal());
        };
        const handleDelete = async () => {
          await fbDeleteExpense(user, value);
        };
        return <EditDelBtns onUpdate={handleUpdate} onDelete={handleDelete} />;
      },
    },
  ];
  return (
    <Container>
      {errorDetails && (
        <ErrorBanner>
          <Alert
            type="error"
            showIcon
            message={errorDetails.title}
            description={
              <ErrorDescription>
                <span>{errorDetails.description}</span>
                {errorDetails.indexUrl && (
                  <>
                    <ErrorActionLink
                      href={errorDetails.indexUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir asistente de índices
                    </ErrorActionLink>
                    <ErrorCodeSnippet>{errorDetails.indexUrl}</ErrorCodeSnippet>
                  </>
                )}
              </ErrorDescription>
            }
          />
        </ErrorBanner>
      )}
      <FilterExpenses
        filters={filters}
        onFiltersChange={handleFilterChange}
        categoryOptions={categoryOptions}
      />
      <AdvancedTable
        columns={columns}
        data={data}
        loading={loading}
        elementName={'Gasto'}
        groupBy={'dateGroup'}
        defaultDate={'today'}
        datesKeyConfig="dateGroup"
      />
      <ExpenseChart
        expenses={expenses}
        isOpen={reportIsOpen}
        onOpen={handleReportOpen}
      />
    </Container>
  );
};

const ErrorBanner = styled.div`
  margin-bottom: 1em;
`;

const ErrorDescription = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5em;
`;

const ErrorActionLink = styled.a`
  font-weight: 600;
  color: var(--primary-6, #1677ff);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorCodeSnippet = styled.code`
  display: block;
  padding: 0.4em 0.6em;
  font-size: 0.85em;
  word-break: break-all;
  background-color: #f5f5f5;
  border-radius: 0.3em;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: white;
`;
