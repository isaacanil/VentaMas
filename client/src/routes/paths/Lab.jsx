import { Lab } from "../../Lab";
import { CashRegisterClosure } from "../../views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure";

const routes = [
    {
        path: "/lab",
        element: <Lab/>,
        children: [
            {
                path: "cierre-caja",
                element: <CashRegisterClosure />
            }
        ]

    },
    
]
export default routes;