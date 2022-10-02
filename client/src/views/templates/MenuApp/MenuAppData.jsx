import {IoIosArrowForward} from 'react-icons/io'
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
        path: '/app/compra',
        subMenu: [
            {
                title: 'Pedido',
                path: '/app/Compra/Pedido'
            },
            {
                title: 'Clientes',
                path: '/app/contact/clientes'
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
        path: '/app/inventario',
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
        title: 'Configuración',
        path: '/app/setting'
    }
]