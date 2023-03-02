import {IoIosArrowForward} from 'react-icons/io'
import { ChevronRight, ChevronLeft } from '../system/Icons/Chevron/Chevron'
export const MenuData = [
    {
        title: 'Inicio',
        path: '/app/',
        
    },
    {
        title: 'Venta',
        path: '/app/venta/1'
    },
    {
        title: 'Compras y Pedidos',
        path: false,
        submenuIconOpen: <ChevronLeft/>,
        submenuIconClose: <ChevronRight/>,
        //<ChevronLeft/> <ChevronRight/>
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
                title: 'Articulos',
                path: '/app/inventario/items'
            },
            {
                title: 'Administrador de Imagenes',
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
   
    {
        title: 'Configuración',
        path: '/app/settings'
    }
]