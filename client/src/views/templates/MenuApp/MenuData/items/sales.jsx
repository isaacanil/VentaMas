import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME  from "../../../../../routes/routesName";

const { SALES, BILLS } = ROUTES_NAME.SALES_TERM

const sales = [{
    title: 'Venta',
    icon: icons.menu.unSelected.sale,
    route: SALES,
    group: 'sales'
},
{
    title: 'Facturas',
    icon: icons.menu.unSelected.register,
    route: BILLS,
    group: 'sales',
    // tag: {
    //     color: '#ff9900',
    //     text: 'Mantenimiento'G
    // }
},]

export default sales;