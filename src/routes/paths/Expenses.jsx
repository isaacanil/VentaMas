import ROUTES_PATH from "../routesName"
import { lazyImport } from "../lazyImport";

const ExpensesCategories = lazyImport(() => import("../../views/pages/Expenses/ExpensesCategories/ExpensesCategories"), "ExpensesCategories");
const ExpensesForm = lazyImport(() => import("../../views/pages/Expenses/ExpensesForm/ExpensesForm"));
const ExpensesList = lazyImport(() => import("../../views/pages/Expenses/ExpensesList/ExpensesList"), "ExpensesList");

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
