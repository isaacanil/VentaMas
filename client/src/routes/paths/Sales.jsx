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
        title: "Ventas - Ventamax",
        metaDescription: "Realiza y gestiona ventas con escaneo de códigos de barras y control eficiente.",
    },
    { 
        path: BILLS, 
        element: validateRouteAccess(<Registro />), 
        title: "Facturas de Ventas - Ventamax",
        metaDescription: "Consulta, registra y gestiona las facturas relacionadas con las ventas en Ventamax POS.",
    },
    { 
        path: CASH_RECONCILIATION, 
        element: validateRouteAccess(<CashReconciliation />), 
        title: "Cuadre de Caja - Ventamax",
        metaDescription: "Realiza el cuadre de caja en Ventamax POS. Revisa, concilia y cierra el flujo de efectivo diario para asegurar la precisión de las transacciones.",
    },
    { 
        path: PREORDERS, 
        element: validateRouteAccess(<Preorder />), 
        title: "Preventas - Ventamax",
        metaDescription: "Revisa, gestiona y convierte las preventas en Ventamax POS. Explora las opciones para cancelar o convertir preventas en facturas fácilmente.",
    },
]

export default Routes;