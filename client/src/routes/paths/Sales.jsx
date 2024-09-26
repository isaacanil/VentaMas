import { Registro, Sales } from '../../views'
import { CashReconciliation } from '../../views/pages/CashReconciliation/CashReconciliation';
import { Preorder } from '../../views/pages/PreorderSale/PreorderSale';

import validateRouteAccess from '../requiereAuthProvider';
import ROUTES_NAME from '../routesName';

const { SALES, BILLS, CASH_RECONCILIATION, PREORDERS } = ROUTES_NAME.SALES_TERM;


const Routes = [
    {
        path: SALES,
        element: validateRouteAccess(<Sales />),
    },
    { 
        path: BILLS, 
        element: validateRouteAccess(<Registro />), 
    },
    { 
        path: CASH_RECONCILIATION, 
        element: validateRouteAccess(<CashReconciliation />), 
    },
    { 
        path: PREORDERS, 
        element: validateRouteAccess(<Preorder />), 
    },
]

export default Routes;