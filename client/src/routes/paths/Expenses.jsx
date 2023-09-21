import { ExpensesCategories } from "../../views/pages/Expenses/ExpensesCategories/ExpensesCategories";
import ExpensesForm from "../../views/pages/Expenses/ExpensesForm/ExpensesForm";
import { ExpensesList } from "../../views/pages/Expenses/ExpensesList/ExpensesList";
import ROUTES_PATH from "../routesName"

const {EXPENSES_LIST, EXPENSES_CREATE, EXPENSES_CATEGORY} = ROUTES_PATH.EXPENSES_TERM
const route = [
    {
        path: EXPENSES_LIST,
        element: <ExpensesList />
    },
    {
        path: EXPENSES_CREATE,
        element: <ExpensesForm />
    },
    {
        path: EXPENSES_CATEGORY,
        element: <ExpensesCategories/>
    }
]

export default route;