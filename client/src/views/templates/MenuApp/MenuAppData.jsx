import {IoIosArrowForward} from 'react-icons/io'
export const MenuData = [
    {
        title: 'Inicio',
        path: '/app/',
        
    },
    {
        title: 'Venta',
        path: '/app/venta'
    },
    {
        title: 'Compra',
        path: '/app/compra'
    },
    {
        title: 'Registro',
        path: '/app/registro'
    },
    {
        title: 'Contacto',
        path: '/app/contact',
        subMenu_icon: <IoIosArrowForward></IoIosArrowForward>,
        submenu: [
            {
                title: 'Clientes',
                path: '/app/contact/clientes'
            },
            {
                title: 'Proveedores',
                path: '/app/contact/proveedores'
            },

        ]
    },
    {
        title: 'Inventario',
        path: '/app/inventario'
    },
    {
        title: 'Configuración',
        path: '/app/setting'
    }
]