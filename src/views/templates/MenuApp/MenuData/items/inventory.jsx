import { icons } from '../../../../../constants/icons/icons';
import ROUTES_NAME from '@/router/routes/routesName';

const {
  CATEGORIES,
  INVENTORY_ITEMS,
  PRODUCT_IMAGES_MANAGER,
  PRODUCT_STUDIO,
  WAREHOUSES,
  INVENTORY_CONTROL,
  INVENTORY_MOVEMENTS,
  INVENTORY_SUMMARY,
} = ROUTES_NAME.INVENTORY_TERM;

// BackOrders proviene del término de compras
const { BACKORDERS } = ROUTES_NAME.PURCHASE_TERM;

const ChevronRight = icons.arrows.chevronRight;
const ChevronLeft = icons.arrows.chevronLeft;

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
        group: 'products',
      },
      {
        title: 'Control de Inventario',
        route: INVENTORY_CONTROL,
        icon: icons.menu.unSelected.inventory,
        group: 'inventoryControl',
      },
      {
        title: 'Resumen Inventario',
        route: INVENTORY_SUMMARY,
        icon: icons.menu.unSelected.inventory,
        group: 'inventoryControl',
      },
      {
        title: 'BackOrders',
        route: BACKORDERS,
        icon: icons.menu.unSelected.order,
        group: 'inventoryControl',
      },
      {
        title: 'Almacenes',
        route: WAREHOUSES,
        icon: icons.inventory.warehouse,
        group: 'inventoryControl',
      },
      {
        title: 'Movimientos de Inventario',
        route: INVENTORY_MOVEMENTS,
        icon: icons.menu.unSelected.inventory,
        group: 'inventoryControl',
      },
      {
        title: 'Categoría de Productos',
        icon: icons.menu.unSelected.category,
        route: CATEGORIES,
        group: 'products',
      },
      {
        title: 'Administrador de Imágenes de Productos',
        route: PRODUCT_IMAGES_MANAGER,
        icon: icons.inventory.multimediaManager,
        group: 'products',
      },
      {
        title: 'Product Studio',
        route: PRODUCT_STUDIO,
        icon: icons.inventory.items,
        group: 'products',
        requiresDevAccess: true,
      },
    ],
  },
];

export default inventory;
