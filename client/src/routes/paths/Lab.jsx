import { Lab } from "../../Lab";
import { Receipt } from "../../views";
import { CashRegisterClosure } from "../../views/pages/CashReconciliation/page/CashRegisterClosure/CashRegisterClosure";
import ReceiptLab from "../../views/pages/checkout/ReceiptLab";

const routes = [
    {
        path: "/lab",
        element: <Lab/>,
        children: [
            {
                path: "receipt",
                element: <ReceiptLab />
            },
           
        ]

    },
    
]
export default routes;