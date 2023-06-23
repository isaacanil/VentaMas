import { useGetProducts } from '../../firebase/products/fbGetProducts';
import {Registro, Sales} from '../../views'
import { CashReconciliation } from '../../views/pages/CashReconciliation/CashReconciliation';
import validateRouteAccess from '../requiereAuthProvider';
import ROUTES_NAME from '../routesName';

const {SALES, BILLS, CASH_RECONCILIATION} = ROUTES_NAME.SALES_TERM;


const Routes = [
    {path: "/sales", element: validateRouteAccess(<Sales />), name: SALES},
    {path: "/bills", element: validateRouteAccess(<Registro />), name: BILLS },
    {path: "/cash-reconciliation", element: validateRouteAccess(<CashReconciliation />), name: CASH_RECONCILIATION}
]

export default Routes;