import ExpensesForm from "../../views/pages/Expenses/ExpensesForm/ExpensesForm";
import { ExpensesList } from "../../views/pages/Expenses/ExpensesList/ExpensesList";
import ROUTES_PATH from "../routesName"

const {EXPENSES_LIST, EXPENSES_CREATE} = ROUTES_PATH.EXPENSES_TERM
const route = [
    {
        path: EXPENSES_LIST,
        element: <ExpensesList />
    },
    {
        path: EXPENSES_CREATE,
        element: <ExpensesForm />
    }
]

export default route;
