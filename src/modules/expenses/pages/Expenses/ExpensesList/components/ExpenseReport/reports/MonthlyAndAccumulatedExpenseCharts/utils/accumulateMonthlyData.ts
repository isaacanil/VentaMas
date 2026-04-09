import { toMillis } from '@/utils/date/toMillis';
import type { TimestampLike } from '@/utils/date/types';
import type { Expense, ExpenseDoc } from '@/utils/expenses/types';

export type MonthlyAccumulatedData = {
    monthlyData: Record<string, number>;
    totalAccumulated: number;
};

type ExpenseEntry = ExpenseDoc | Expense | null | undefined;

const resolveExpense = (entry: ExpenseEntry): Expense | undefined => {
    if (!entry || typeof entry !== 'object') return undefined;
    if ('expense' in entry) {
        const nested = (entry as { expense?: unknown }).expense;
        if (nested && typeof nested === 'object') {
            return nested as Expense;
        }
        return undefined;
    }
    return entry as Expense;
};

const normalizeAmount = (value: Expense['amount']): number => {
    const amount =
        typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : 0;
    return Number.isFinite(amount) ? amount : 0;
};

const toMonthYearLabel = (value: TimestampLike | undefined): string => {
    if (value === null || value === undefined) {
        return new Date(NaN).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    if (typeof value === 'string' || typeof value === 'number' || value instanceof Date) {
        return new Date(value).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    const millis = toMillis(value);
    const date = Number.isFinite(millis) ? new Date(millis) : new Date(NaN);
    return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

export const accumulateMonthlyData = (
    expenses: ReadonlyArray<ExpenseEntry>,
): MonthlyAccumulatedData => {
    const monthlyData: Record<string, number> = {};
    let totalAccumulated = 0;

    for (const entry of expenses) {
        const expense = resolveExpense(entry);
        if (!expense) continue;

        const monthYear = toMonthYearLabel(expense.dates?.expenseDate);
        const amount = normalizeAmount(expense.amount);

        monthlyData[monthYear] = (monthlyData[monthYear] ?? 0) + amount;
        totalAccumulated += amount;
    }

    return { monthlyData, totalAccumulated };
};
