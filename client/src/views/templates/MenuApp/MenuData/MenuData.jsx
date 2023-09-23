import { faChevronLeft, faChevronRight, faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '../../../../constants/icons/icons'
import findRouteByName from '../findRouteByName'
import ROUTES_NAME from '../../../../routes/routesName'
import basic from './items/basic'
import sales from './items/sales'
import financialManagement from './items/financialManagement'
import inventory from './items/inventory'
import admin from './items/admin'
import contacts from './items/contacts'
import changelogs from './items/changelogs'

export const ChevronRight = <FontAwesomeIcon icon={faChevronRight} />
export const ChevronLeft = <FontAwesomeIcon icon={faChevronLeft} />

const { LOGIN, SIGNUP } = ROUTES_NAME.AUTH_TERM
const { HOME, WELCOME } = ROUTES_NAME.BASIC_TERM
const { SALES, BILLS } = ROUTES_NAME.SALES_TERM
const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM
const { EXPENSES_LIST, EXPENSES_CREATE, EXPENSES_CATEGORY } = ROUTES_NAME.EXPENSES_TERM
const { CLIENTS, SUPPLIERS } = ROUTES_NAME.CONTACT_TERM
const { SETTINGS } = ROUTES_NAME.SETTING_TERM
const { ORDERS, PURCHASES, PURCHASES_CREATE, ORDERS_CREATE } = ROUTES_NAME.PURCHASE_TERM
const { INVENTORY_ITEMS, CATEGORIES, INVENTORY_SERVICES, PRODUCT_IMAGES_MANAGER, PRODUCT_OUTFLOW } = ROUTES_NAME.INVENTORY_TERM

export const getMenuData = () => {
    return [
        ...basic,
        ...sales,
        ...inventory,
        ...financialManagement,
        ...contacts,
        ...admin,
        ...changelogs
    ]
}