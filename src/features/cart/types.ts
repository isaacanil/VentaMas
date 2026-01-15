import type { ProductBatchInfo } from '../../types/products';

export interface Delivery {
    status: boolean;
    value: string | number;
}

export interface Client {
    id: string;
    name: string;
    tel: string;
    address: string;
    personalID: string;
    delivery?: Delivery;
}

export interface Product {
    id: string;
    cid: string;
    name: string;
    price?: number | { unit?: number | string; total?: number | string };
    amountToBuy: number;
    productStockId?: string;
    batchId?: string;
    stock?: number;
    batchInfo?: ProductBatchInfo;
    weightDetail?: {
        isSoldByWeight: boolean;
        weight: number;
    };
    pricing?: {
        listPrice: number;
        price: number;
        tax?: number | string;
        [key: string]: any;
    };
    selectedSaleUnit?: {
        pricing: {
            price: number;
        };
        [key: string]: any;
    } | null;
    insurance?: {
        mode: string | null;
        value: number;
    };
    cost: {
        total: number;
    };
    discount?: {
        type: 'percentage' | 'amount';
        value: number;
    };
    [key: string]: any;
}

export interface PaymentMethod {
    method: string;
    name?: string;
    value: number;
    status: boolean;
    reference?: string;
}

export interface PreorderDetails {
    date?: number | { seconds: number; nanoseconds: number };
    preorderNumber?: string | null;
    createdAt?: number | null;
}

export interface OrderHistory {
    date?: number | string | { seconds: number; nanoseconds: number };
    [key: string]: any;
}

export interface CreditNotePayment {
    id: string;
    ncf: string;
    amountUsed: number;
    originalAmount: number;
    appliedDate: string;
}

export interface DiscountContext {
    value: number;
    reason?: string;
    authorizedBy?: string;
}

export interface CartData {
    id: string | null;
    cartId?: string;
    cartIdRef?: string;
    isAddedToReceivables: boolean;
    seller: { name?: string; id?: string };
    client: Client;
    products: Product[];
    change: { value: number };
    delivery: Delivery;
    discount: { value: number };
    dueDate: number | string | null;
    hasDueDate: boolean;
    paymentMethod: PaymentMethod[];
    NCF: string | null;
    totalShoppingItems: { value: number };
    totalPurchaseWithoutTaxes: { value: number };
    totalTaxes: { value: number };
    payment: { value: number };
    totalPurchase: { value: number };
    sourceOfPurchase: string;
    status: string;
    preorderDetails: PreorderDetails;
    history: OrderHistory[];
    insuranceEnabled: boolean;
    totalInsurance: { value: number };
    invoiceComment: string;
    creditNotePayment: CreditNotePayment[];
    authorizationContext?: {
        discount?: DiscountContext | null;
        [key: string]: any;
    };
    [key: string]: any;
}

export interface CartSettings {
    taxReceipt: { enabled: boolean };
    printInvoice: boolean;
    isInvoicePanelOpen: boolean;
    billing: {
        billingMode: string;
        invoiceType?: string;
        authorizationFlowEnabled: boolean;
        enabledAuthorizationModules: {
            invoices: boolean;
            accountsReceivable: boolean;
            cashRegister: boolean;
        };
        isLoading: boolean;
        isError: string | boolean | null;
        stockAlertsEnabled?: boolean;
    };
    isPreOrderEnabled?: boolean;
}

export interface CartState {
    permission: {
        openCashReconciliation: boolean;
    };
    settings: CartSettings;
    isOpen: boolean;
    showCxcAutoRemovalNotification: boolean;
    data: CartData;
}
