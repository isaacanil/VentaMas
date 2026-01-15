/**
 * @file ExpensesTable.tsx
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
import type { UserIdentity } from '@/types/users';
import { formatPrice } from '@/utils/format';
import {
  coerceExpenseAmount,
  coerceExpenseNumber,
  getExpenseReceiptUrl,
  normalizeExpenseStatus,
} from '@/utils/expenses/normalize';
import type { Expense, ExpenseAttachment, ExpenseDoc } from '@/utils/expenses/types';
import { truncateString } from '@/utils/text/truncateString';
import { ExpenseChart } from '@/modules/expenses/pages/Expenses/ExpensesList/components/ExpenseReport/ExpenseReport';
import { AdvancedTable } from '@/components/ui/AdvancedTable/AdvancedTable';
import { Button } from '@/components/ui/Button/Button';
import { EditDelBtns } from '@/components/ui/Button/EditDelBtns/EditDelBtns';

import { FilterExpenses } from '../FilterBar/FilterExpenses';

const FIREBASE_INDEX_LINK_REGEX =
  /(https:\/\/console\.firebase\.google\.com\/[^\s"'`]+)/i;

type ExpenseErrorDetails =
  | {
      type: 'index';
      title: string;
      description: string;
      indexUrl: string | null;
    }
  | {
      type: 'generic';
      title: string;
      description: string;
    };

const extractFirebaseIndexLink = (error: unknown) => {
  if (!error || typeof error !== 'object') return null;

  const maybeError = error as {
    link?: unknown;
    customData?: { link?: unknown; path?: unknown };
    message?: unknown;
  };

  const candidates = [
    maybeError.link,
    maybeError.customData?.link,
    maybeError.customData?.path,
    maybeError.message,
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

const buildExpensesErrorDetails = (error: unknown): ExpenseErrorDetails | null => {
  if (!error) return null;

  const maybeError = error as { code?: unknown; message?: unknown };
  const code = typeof maybeError?.code === 'string' ? maybeError.code.toLowerCase() : '';
  const messageText = typeof maybeError?.message === 'string' ? maybeError.message : '';
  const requiresIndex =
    code.includes('failed-precondition') && /requires an index/i.test(messageText);

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

interface DateRangeFilter {
  startDate?: number | Date | null;
  endDate?: number | Date | null;
}

interface ExpenseFilters {
  category?: string;
  status?: string;
  dateRange?: DateRangeFilter;
}

interface ExpenseRow {
  [key: string]: unknown;
  id: string;
  number: number;
  category?: string;
  description?: string;
  dateExpense: number | null;
  amount: number;
  receiptImg: string | null;
  attachments: ExpenseAttachment[];
  action: Expense;
  status: string;
  createdAt: number | null;
  dateGroup: string;
}

/**
 * @function ExpensesTable
 * @desc A component that renders a table of expenses.
 * @returns {JSX.Element} The ExpensesTable component
 */
export const ExpensesTable = ({ searchTerm = '' }: { searchTerm?: string }) => {
  const user = useSelector(selectUser) as UserIdentity | null;
  const dispatch = useDispatch();

  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    startDate: null,
    endDate: null,
  });
  const { expenses, loading, error } = useFbGetExpenses(dateRange);
  const errorDetails = useMemo(() => buildExpensesErrorDetails(error), [error]);

  const [filters, setFilters] = useState<ExpenseFilters>({});

  const handleFilterChange = useCallback(
    (newFilters: ExpenseFilters) => {
      setFilters(newFilters);

      const newDateRange = newFilters.dateRange;
      if (newDateRange) {
        try {
          const startDate = newDateRange.startDate ?? null;
          const endDate = newDateRange.endDate ?? null;

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

  const normalizedExpenses = Array.isArray(expenses) ? (expenses as ExpenseDoc[]) : [];
  const categories = [
    ...new Set(normalizedExpenses.map(({ expense }) => expense?.category)),
  ].filter(Boolean);
  const categoryOptions = categories.map((category) => ({
    label: category,
    value: category,
  }));

  const data: ExpenseRow[] = normalizedExpenses
    .map(({ expense: rawExpense }) => {
      const expense = rawExpense ?? {};
      const normalizedStatus = normalizeExpenseStatus(expense.status);
      const normalizedExpense: Expense = {
        ...expense,
        status: normalizedStatus,
      };

      const receiptImageUrl = getExpenseReceiptUrl(expense);

      const createdAt = Number.isFinite(expense?.dates?.createdAt)
        ? (expense.dates?.createdAt as number)
        : null;
      const expenseDate = Number.isFinite(expense?.dates?.expenseDate)
        ? (expense.dates?.expenseDate as number)
        : createdAt;

      const amount = coerceExpenseAmount(expense?.amount);

      const number = Number.isFinite(expense?.numberId)
        ? (expense.numberId as number)
        : coerceExpenseNumber(expense?.number);

      return {
        id: expense.id ?? normalizedExpense.id ?? '',
        number,
        category: expense.category,
        description: expense.description,
        dateExpense: expenseDate,
        amount,
        receiptImg: receiptImageUrl,
        attachments: Array.isArray(expense.attachments) ? expense.attachments : [],
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
          (item.category && item.category.toLowerCase().includes(searchLower)) ||
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
      cell: ({ value }: { value: string }) => truncateString(value, 18),
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
      cell: ({ value }: { value: number | null }) => convertMillisToDate(value),
    },
    {
      Header: 'Importe',
      accessor: 'amount',
      minWidth: '50px',
      maxWidth: '1fr',
      cell: ({ value }: { value: number }) => formatPrice(value),
    },
    {
      Header: 'Recibo',
      accessor: 'receiptImg',
      minWidth: '70px',
      maxWidth: '70px',
      cell: ({ value }: { value: string | null }) => {
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
      cell: ({ value }: { value: Expense }) => {
        const handleUpdate = async () => {
          dispatch(setExpense(value));
          dispatch(setExpenseMode('update'));
          dispatch(openExpenseFormModal());
        };
        const handleDelete = async () => {
          await fbDeleteExpense(user, value as any);
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
                {'indexUrl' in errorDetails && errorDetails.indexUrl && (
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
        filters={filters as any}
        onFiltersChange={handleFilterChange as any}
        categoryOptions={categoryOptions as any}
      />
      <AdvancedTable
        columns={columns as any}
        data={data}
        loading={loading}
        elementName={'Gasto'}
        groupBy={'dateGroup'}
        defaultDate={'today'}
        datesKeyConfig="dateGroup"
      />
      <ExpenseChart />
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
