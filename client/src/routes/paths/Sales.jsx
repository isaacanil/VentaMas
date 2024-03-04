import { useGetProducts } from '../../firebase/products/fbGetProducts';
import { Registro, Sales } from '../../views'
import { CashReconciliation } from '../../views/pages/CashReconciliation/CashReconciliation';
import { ErrorElement } from '../../views/pages/ErrorElement/ErrorElement';
import validateRouteAccess from '../requiereAuthProvider';
import ROUTES_NAME from '../routesName';

const { SALES, BILLS, CASH_RECONCILIATION } = ROUTES_NAME.SALES_TERM;


const Routes = [
    {
        path: SALES,
        element: validateRouteAccess(<Sales />),
        name: SALES
    },
    { path: BILLS, element: validateRouteAccess(<Registro />), name: BILLS },
    { path: CASH_RECONCILIATION, element: validateRouteAccess(<CashReconciliation />), name: CASH_RECONCILIATION }
]

export default Routes;