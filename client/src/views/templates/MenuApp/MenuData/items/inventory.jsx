import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME from "../../../../../routes/routesName";

const {
    CATEGORIES, 
    INVENTORY_ITEMS, 
    INVENTORY_SERVICES,
    PRODUCT_IMAGES_MANAGER, 
    PRODUCT_OUTFLOW, 
    WAREHOUSES,
    SERVICE_OUTFLOW
} = ROUTES_NAME.INVENTORY_TERM

const ChevronRight = icons.arrows.chevronRight
const ChevronLeft = icons.arrows.chevronLeft

const inventory = [
    {
        title: 'Inventario',
        icon: icons.menu.unSelected.inventory,
        submenuIconOpen: ChevronLeft,
        submenuIconClose: ChevronRight,
        group: 'inventory',
        submenu: [
            {
                title: 'Administrar Productos',
                route: INVENTORY_ITEMS,
                icon: icons.inventory.items,
                group: 'inventoryItems'
            },
            {
                title: 'Categoría',
                icon: icons.menu.unSelected.category,
                route: CATEGORIES,
                group: 'inventoryItems'
            },
            {
                title: 'Almacenes',
                route: WAREHOUSES,
                icon: null,
                group: 'inventoryItems'
            },
            {
                title: 'Administrador de Imágenes',
                route: PRODUCT_IMAGES_MANAGER,
                icon: icons.inventory.multimediaManager,
                group: 'inventoryItems'
            },
            {
                title: 'Administrar Servicios',
                route: INVENTORY_SERVICES,
                icon: icons.inventory.services,
                group: 'inventoryServices'
            },
            {
                title: 'Salidas de Productos',
                route: PRODUCT_OUTFLOW,
                icon: icons.inventory.productOutFlow,
                group: 'inventoryItems'
            }
        ]
    },
]

export default inventory;