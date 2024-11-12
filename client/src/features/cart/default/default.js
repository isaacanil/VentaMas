import { GenericClient } from "../../clientCart/clientCartSlice";

const defaultDelivery = {
    status: false,
    value: ""
}

const defaultClient = {
    name: "",
    tel: "",
    address: "",
    personalID: "",
    delivery: defaultDelivery
};

const defaultPaymentMethod = [
    {
        method: "cash",
        value: 0,
        status: true
    },
    {
        method: "card",
        value: 0,
        reference: "",
        status: false
    },
    {
        method: "transfer",
        value: 0,
        reference: "",
        status: false
    }
];

const initialState = {
    permission: {
        openCashReconciliation: false
    },
    settings: {
        taxReceipt: { enabled: false },
        printInvoice: true,
        isInvoicePanelOpen: false,
        billing: {
            billingMode: 'direct',
            isLoading: false,
            isError: null
        }
    },
    isOpen: false,
    data: {
        isAddedToReceivables: false,
        id: '',
        seller: {},
        client: GenericClient,
        products: [],
        change: {
            value: 0
        },
        delivery: defaultDelivery,
        discount: {
            value: 0
        },
        dueDate: null,
        hasDueDate: false,
        paymentMethod: defaultPaymentMethod,
        NCF: null,
        totalShoppingItems: {
            value: 0
        },
        totalPurchaseWithoutTaxes: {
            value: 0
        },
        totalTaxes: {
            value: 0
        },
        payment: {//pago realizado por el cliente
            value: 0
        },
        totalPurchase: {
            value: 0
        },
        sourceOfPurchase: 'Presencial',
        status: 'completed', 
        preorderDetails: {
            preorderNumber: null,
            createdAt: null,
        },
        history: []
    },
}
/*los estados pueden ser:
    - preorder
    - completed
    - cancelled-preorder
    - cancelled
    - refunded
*/
export {
    defaultClient,
    defaultDelivery,
    defaultPaymentMethod,
    initialState
};
