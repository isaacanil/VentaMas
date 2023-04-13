import { faChevronLeft, faChevronRight, faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '../../../constants/icons/icons'
const ChevronRight = <FontAwesomeIcon icon={faChevronRight} />
const ChevronLeft = <FontAwesomeIcon icon={faChevronLeft} />
export const MenuData = [
    {
        title: 'Inicio',
        icon: icons.menu.unSelected.home,
        iconActive: icons.menu.selected.home,
        path: '/app/',    
    },
    {
        title: 'Venta',
        icon: icons.menu.unSelected.sale,

        path: '/app/sale/1'
    },
    {
        title: 'Compras y Pedidos',
        icon: icons.menu.unSelected.purchase,
        path: false,
        submenuIconOpen: ChevronLeft,
        submenuIconClose: ChevronRight,
        submenu: [
            {
                title: 'Pedidos Pendientes',
                path: '/app/pedido',
                icon: <FontAwesomeIcon icon={faClipboard} />,  
                
            },
            {
                title: 'Compras',
                path: '/app/compra',
                icon: <FontAwesomeIcon icon={faClipboardCheck} />
            }
        ]
    },
    {
        title: 'Inventario',
        icon: icons.menu.unSelected.inventory,
        iconActive: icons.menu.selected.inventory,
        path: false,
        submenuIconOpen: ChevronLeft,
        submenuIconClose: ChevronRight,
        submenu: [
            {
                title: 'Administrar Productos',
                path: '/app/inventario/items',
                icon: icons.inventory.items
            },
            {
                title: 'Administrador de Imágenes',
                path: '/app/inventario/multimedia_manager',
                icon: icons.inventory.multimediaManager
            },
            {
                title: 'Administrar Servicios',
                path: '/app/inventario/services',
                icon: icons.inventory.services
            },
            {
                title: 'Salidas de Productos',
                path: '/app/inventario/product-outflow',  
                icon: icons.inventory.productOutFlow
            }
           

        ]
    },
    {
        title: 'Contacto',
        icon: icons.menu.unSelected.contacts,
        iconActive: icons.menu.selected.contacts,
        submenuIconOpen: ChevronLeft,
        submenuIconClose: ChevronRight,
        path: false,
        submenu: [
            {
                title: 'Clientes',
                path: '/app/contact/client',
                icon: icons.users.client
            },
            {
                title: 'Proveedores',
                path: '/app/contact/provider',
                icon: icons.users.provider
            },

        ]
    },
    {
        title: 'Categoría',
        icon: icons.menu.unSelected.category,
        iconActive: icons.menu.selected.category,
        path: '/app/category',
        
    },
    {
        title: 'Registro',  
        icon: icons.menu.unSelected.register,
        iconActive: icons.menu.selected.register,
        path: '/app/registro'
    },
    {
        title: 'Configuración',
        icon: icons.menu.unSelected.settings,
        iconActive: icons.menu.selected.settings,
        path: '/app/settings'
    }
]