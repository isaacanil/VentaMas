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
        title: 'Compra',
        path: false,
        submenuIconOpen: <ChevronLeft/>,
        submenuIconClose: <ChevronRight/>,
        //<ChevronLeft/> <ChevronRight/>
        submenu: [
            {
                title: 'Pedido',
                path: '/app/pedido'
            },
            {
                title: 'Compra',
                path: '/app/compra'
            }
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
        title: 'Inventario',
        path: false,
        submenuIconOpen: <ChevronLeft/>,
        submenuIconClose: <ChevronRight/>,
        submenu: [
            {
                title: 'Articulos',
                path: '/app/inventario'
            },
           

        ]
    },
    {
        title: 'Configuración',
        path: '/app/setting'
    }
]