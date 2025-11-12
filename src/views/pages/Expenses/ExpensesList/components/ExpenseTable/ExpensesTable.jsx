/**
 * @file ExpensesTable.jsx
 * @desc A component that renders a table of expenses.
 * @version 0.1.0
 * @since 0.1.0
 */

import { message } from 'antd'
import { DateTime } from 'luxon'
import { useState, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import styled from 'styled-components'

import { selectUser } from '../../../../../../features/auth/userSlice'
import { setExpense, setExpenseMode } from '../../../../../../features/expense/expenseManagementSlice'
import { openExpenseFormModal } from '../../../../../../features/expense/expenseUISlice'
import { toggleImageViewer } from '../../../../../../features/imageViewer/imageViewerSlice'
import { fbDeleteExpense } from '../../../../../../firebase/expenses/Items/fbDeleteExpense'
import { useFbGetExpenses } from '../../../../../../firebase/expenses/Items/useFbGetExpenses'
import { useFormatPrice } from '../../../../../../hooks/useFormatPrice'
import { convertMillisToDate } from '../../../../../../hooks/useFormatTime'
import { truncateString } from '../../../../../../utils/text/truncateString'
import { FilterBar } from '../../../../../component/FilterBar/FilterBar'
import { AdvancedTable } from '../../../../../templates/system/AdvancedTable/AdvancedTable'
import { Button } from '../../../../../templates/system/Button/Button'
import { EditDelBtns } from '../../../../../templates/system/Button/EditDelBtns/EditDelBtns'
import { ExpenseChart } from '../ExpenseReport/ExpenseReport'

/**
 * @function ExpensesTable
 * @desc A component that renders a table of expenses.
 * @returns {JSX.Element} The ExpensesTable component
 */
export const ExpensesTable = () => {
    const user = useSelector(selectUser);
    const dispatch = useDispatch();

    const [searchTerm, setSearchTerm] = useState('');
    const [dateRange, setDateRange] = useState({
        startDate: null,
        endDate: null
    });
    const { expenses } = useFbGetExpenses(dateRange);

    const [reportIsOpen, setReportIsOpen] = useState(false);
    const handleReportOpen = () => setReportIsOpen(!reportIsOpen);

    const [filters, setFilters] = useState({});

    const handleFilterChange = useCallback((newFilterState) => {
        setFilters(newFilterState.filters);

        if (newFilterState.filters.dateRange) {
            try {
                const startDate = newFilterState.filters.dateRange.startDate ?
                    (typeof newFilterState.filters.dateRange.startDate === 'number' ?
                        newFilterState.filters.dateRange.startDate :
                        new Date(newFilterState.filters.dateRange.startDate).getTime()) :
                    null;

                const endDate = newFilterState.filters.dateRange.endDate ?
                    (typeof newFilterState.filters.dateRange.endDate === 'number' ?
                        newFilterState.filters.dateRange.endDate :
                        new Date(newFilterState.filters.dateRange.endDate).getTime()) :
                    null;

                if (startDate !== dateRange?.startDate || endDate !== dateRange?.endDate) {
                    setDateRange({
                        startDate,
                        endDate
                    });
                }
            } catch (error) {
                console.error('Error processing date range:', error);
            }
        }
    }, [setDateRange, dateRange]);

    const categories = [...new Set(expenses.map(({ expense }) => expense.category))].filter(Boolean);
    const categoryOptions = categories.map(category => ({ label: category, value: category }));    // Filter config for FilterBar
    const filterConfig = {
        filters: [
            {
                key: 'category',
                type: 'select',
                placeholder: 'Categoría',
                options: categoryOptions
            },
            {
                key: 'status',
                type: 'status',
                placeholder: 'Estado',
                visibleStatus: ['active', 'canceled', 'completed', 'pending']
            },
        ],
        showSortButton: true,
        showResetButton: true,
        defaultValues: {
            dateRange: dateRange?.startDate && dateRange?.endDate ? {
                startDate: dateRange.startDate,
                endDate: dateRange.endDate
            } : null,
            status: 'active'
        },
        defaultSort: {
            isAscending: false
        }
    };

    const data = expenses
        .map(({ expense }) => {
            // Extraer la URL real si es un objeto complejo
            
            let receiptImageUrl = null;
            if (expense.attachments?.length > 0) {
                const firstAttachment = expense.attachments[0];
                if (firstAttachment.url && typeof firstAttachment.url === 'object' && firstAttachment.url.url) {
                    receiptImageUrl = firstAttachment.url.url;
                } else if (typeof firstAttachment.url === 'string') {
                    receiptImageUrl = firstAttachment.url;
                }
            } else if (expense.receiptImageUrl) {
                receiptImageUrl = expense.receiptImageUrl;
            }

            const createdAt = Number.isFinite(expense?.dates?.createdAt)
                ? expense.dates.createdAt
                : null;

            return {
                number: expense.numberId,
                category: expense.category,
                description: expense.description,
                dateExpense: expense?.dates?.expenseDate,
                amount: expense.amount,
                receiptImg: receiptImageUrl,
                attachments: expense.attachments || [],
                action: expense,
                status: expense.status,
                createdAt,
                dateGroup: createdAt
                    ? DateTime.fromMillis(createdAt).toLocaleString(DateTime.DATE_FULL)
                    : 'Fecha sin registrar'
            }
        })

        .filter(item => {
            if (filters.category && item.category !== filters.category) return false;

            if (filters.status && item.status !== filters.status) return false;

            if (searchTerm && searchTerm.trim() !== '') {
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    (item.category && item.category.toLowerCase().includes(searchLower)) ||
                    (item.description && item.description.toLowerCase().includes(searchLower)) ||
                    String(item.number).includes(searchLower) ||
                    String(item.amount).includes(searchLower);
                if (!matchesSearch) {
                    return false;
                }
            }

            return true;
        })
        .sort((a, b) => b.number - a.number)

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
            Header: "Descripción",
            accessor: 'description',
            minWidth: '60px',
            maxWidth: '1fr',
            cell: ({ value }) => truncateString(value, 18)
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
            cell: ({ value }) => convertMillisToDate(value)
        },
        {
            Header: 'Importe',
            accessor: 'amount',
            minWidth: '50px',
            maxWidth: '1fr',
            cell: ({ value }) => useFormatPrice(value)
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
                }
                return (
                    <Button title='Ver' onClick={handleClick} />
                )
            }
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
                }
                const handleDelete = async () => {
                    await fbDeleteExpense(user, value);
                }
                return (
                    <EditDelBtns
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                    />
                )
            }
        }
    ]
    return (
        <Container>
            <FilterBar
                config={filterConfig}
                onChange={handleFilterChange}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm ? (value) => setSearchTerm(value) : undefined}
                dataConfig={{
                    category: {
                        data: categoryOptions,
                        accessor: (item) => item
                    }
                }}
            />
            <AdvancedTable
                columns={columns}
                data={data}
                elementName={'Gasto'}
                groupBy={'dateGroup'}
                defaultDate={'today'}
                datesKeyConfig='dateGroup'
            />
            <ExpenseChart expenses={expenses} isOpen={reportIsOpen} onOpen={handleReportOpen} />
        </Container>
    )
}

const Container = styled.div`
    height: 100%;
    width: 100%;
    background-color: white;
    display: flex;
    flex-direction: column;
    overflow: hidden;
`
