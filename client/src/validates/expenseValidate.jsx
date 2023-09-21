export const validateExpense = (expense) => {
    let errors = {};

    if (!expense.description) {
        errors.name = 'Descripción es requerido';
    }
    if (!expense.amount) {
        errors.amount = 'Importe es requerido';
    }

    if (!expense.category) {
        errors.category = 'Categoría es requerido';
    }
    if (!expense.dates.expenseDate) {
        errors.expenseDate = 'Fecha de gasto es requerido';
    }

    return errors;
};