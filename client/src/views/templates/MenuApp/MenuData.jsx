import {IoIosArrowForward} from 'react-icons/io'
import { ChevronRight, ChevronLeft } from '../system/Icons/Chevron/Chevron'
export const MenuData = [
    {
        title: 'Inicio',
        path: '/app/',    
    },
    {
        title: 'Venta',
        path: '/app/sale/1'
    },
    {
        title: 'Compras y Pedidos',
        path: false,
        submenuIconOpen: <ChevronLeft/>,
        submenuIconClose: <ChevronRight/>,
        submenu: [
            {
                title: 'Pedidos Pendientes',
                path: '/app/pedido'
            },
            {
                title: 'Compras',
                path: '/app/compra'
            }
        ]
    },
    {
        title: 'Inventario',
        path: false,
        submenuIconOpen: <ChevronLeft/>,
        submenuIconClose: <ChevronRight/>,
        submenu: [
            {
                title: 'Artículos',
                path: '/app/inventario/items'
            },
            {
                title: 'Administrador de Imágenes',
                path: '/app/inventario/multimedia_manager'
            }
           

        ]
    },
    {
        title: 'Contacto',
        submenuIconOpen: <ChevronLeft/>,
        submenuIconClose: <ChevronRight/>,
        path: false,
        submenu: [
            {
                title: 'Clientes',
                path: '/app/contact/client'
            },
            {
                title: 'Proveedores',
                path: '/app/contact/provider'
            },

        ]
    },
    {
        title: 'Categoría',
        path: '/app/category',
        
    },
    {
        title: 'Registro',
        path: '/app/registro'
    },
    // {
    //     title: 'Reportes',
    //     path: null,
    //     submenuIconOpen: <ChevronLeft/>,
    //     submenuIconClose: <ChevronRight/>,
    //     submenu: [
    //         {
    //             title: 'Ventas',
    //             path: '/app/report/sales'                    
    //         }
    //     ]

    // },
    {
        title: 'Configuración',
        path: '/app/settings'
    }
]