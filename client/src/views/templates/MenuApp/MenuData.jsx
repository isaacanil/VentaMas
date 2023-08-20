import { faChevronLeft, faChevronRight, faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '../../../constants/icons/icons'
import findRouteByName from './findRouteByName'
import ROUTES_NAME from '../../../routes/routesName'

const ChevronRight = <FontAwesomeIcon icon={faChevronRight} />
const ChevronLeft = <FontAwesomeIcon icon={faChevronLeft} />
const { LOGIN, SIGNUP } = ROUTES_NAME.AUTH_TERM
const { HOME, WELCOME } = ROUTES_NAME.BASIC_TERM
const { SALES, BILLS} = ROUTES_NAME.SALES_TERM
const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM
const { CLIENTS, SUPPLIERS } = ROUTES_NAME.CONTACT_TERM
const { SETTINGS } = ROUTES_NAME.SETTING_TERM
const { ORDERS, PURCHASES, PURCHASES_CREATE, ORDERS_CREATE } = ROUTES_NAME.PURCHASE_TERM
const { INVENTORY_ITEMS, CATEGORIES, INVENTORY_SERVICES, PRODUCT_IMAGES_MANAGER, PRODUCT_OUTFLOW } = ROUTES_NAME.INVENTORY_TERM

export const getMenuData = () => {
    return [
        {
            title: 'Inicio',
            icon: icons.menu.unSelected.home,
            route: HOME
        },
        {
            title: 'Venta',
            icon: icons.menu.unSelected.sale,
            route: SALES
        },
        {
            title: 'Facturas',
            icon: icons.menu.unSelected.register,
            route: BILLS
        },
        {
            title: 'Compras y Pedidos',
            icon: icons.menu.unSelected.purchase,
            submenuIconOpen: ChevronLeft,
            submenuIconClose: ChevronRight,
            submenu: [
                {
                    title: 'Pedidos Pendientes',
                    icon: <FontAwesomeIcon icon={faClipboard} />,
                    route: ORDERS

                },
               {
                    title: 'Crear Pedido',
                    route: ORDERS_CREATE,
                    icon: <FontAwesomeIcon icon={faClipboard} />

               },
                {
                    title: 'Compras',
                    route: PURCHASES,
                    icon: <FontAwesomeIcon icon={faClipboardCheck} />
                },
                {
                    title: 'Crear Compra',
                    route: PURCHASES_CREATE,
                    icon: <FontAwesomeIcon icon={faClipboardCheck} />
                },
            ]
        },
        {
            title: 'Cuadre de caja',
            icon: icons.menu.unSelected.cashReconciliation,
            route: CASH_RECONCILIATION_LIST
        },
        {
            title: 'Inventario',
            icon: icons.menu.unSelected.inventory,
            submenuIconOpen: ChevronLeft,
            submenuIconClose: ChevronRight,
            submenu: [
                {
                    title: 'Administrar Productos',
                    route: INVENTORY_ITEMS,
                    icon: icons.inventory.items
                },
                {
                    title: 'Categoría',
                    icon: icons.menu.unSelected.category,
                    route: CATEGORIES

                },
                {
                    title: 'Administrador de Imágenes',
                    route: PRODUCT_IMAGES_MANAGER,
                    icon: icons.inventory.multimediaManager
                },
                {
                    title: 'Administrar Servicios',
                    route: INVENTORY_SERVICES,
                    icon: icons.inventory.services
                },
                {
                    title: 'Salidas de Productos',
                    route: PRODUCT_OUTFLOW,
                    icon: icons.inventory.productOutFlow
                }
            ]
        },
        {
            title: 'Contacto',
            icon: icons.menu.unSelected.contacts,
            submenuIconOpen: ChevronLeft,
            submenuIconClose: ChevronRight,
            path: false,
            submenu: [
                {
                    title: 'Clientes',
                    route: CLIENTS,
                    icon: icons.users.client
                },
                {
                    title: 'Proveedores',
                    route: SUPPLIERS,
                    icon: icons.users.provider
                },

            ]
        },
        {
            title: 'Configuración',
            icon: icons.menu.unSelected.settings,
            route: SETTINGS
        }
    ]
}