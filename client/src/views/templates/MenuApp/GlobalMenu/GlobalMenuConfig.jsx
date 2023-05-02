import { InventoryMenuToolbar } from "./Page/InventoryMenuToolbar";
import { VentaMenuToolbar } from "./Page/VentaMenuToolBar";

const componentsConfig = [
    {
      id: 'ventaMenuToolBar',
      component: VentaMenuToolbar,
    },
    {
      id: 'inventoryMenuToolBar',
      component: InventoryMenuToolbar,
    },
  ];
  
  const generateToolbarConfig = (side) =>
    componentsConfig.map((component) => ({
      ...component,
      id: `${component.id}${side}`,
      side,
    }));
  
  export const toolbarConfig = {
    leftSide: generateToolbarConfig('left'),
    rightSide: generateToolbarConfig('right'),
  };