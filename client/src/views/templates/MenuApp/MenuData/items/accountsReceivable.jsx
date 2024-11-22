import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME from "../../../../../routes/routesName";

const { RECEIVABLE_PAYMENT_RECEIPTS, ACCOUNT_RECEIVABLE_LIST } = ROUTES_NAME.ACCOUNT_RECEIVABLE;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

const paths = [
    {
        title: 'Cuentas por Cobrar',
        icon: icons.finances.fileInvoiceDollar,
        submenuIconOpen: ChevronLeft,
        submenuIconClose: ChevronRight,
        group: 'accountsReceivable',
        submenu: [
            {
                title: 'Listado',
                route: ACCOUNT_RECEIVABLE_LIST,
                icon: icons.menu.unSelected.list,
                group: 'accountsReceivableList'
            },
            {
                title: 'Recibos de pagos',
                route: RECEIVABLE_PAYMENT_RECEIPTS,
                icon: icons.menu.unSelected.register,
                group: 'accountsReceivableReceipts'
            },
        ]
    },
]

export default paths;