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
        status: false
    },
    {
        method: "transfer",
        value: 0,
        status: false
    }
];
const initialState = {
    permission: {
        openCashReconciliation: false
    },
    isOpen: false,
    data: {
        id: '',
        client: GenericClient,
        products: [],
        change: {
            value: 0
        },
        delivery: defaultDelivery,
        discount: {
            value: 0
        },
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
        sourceOfPurchase: 'Presencial'
    },

}
export {
    defaultClient,
    defaultDelivery,
    defaultPaymentMethod,
    initialState
};
