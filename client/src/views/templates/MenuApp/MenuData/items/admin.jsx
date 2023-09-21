import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME from "../../../../../routes/routesName";

const { SETTINGS } = ROUTES_NAME.SETTING_TERM
const { CASH_RECONCILIATION_LIST } = ROUTES_NAME.CASH_RECONCILIATION_TERM

const admin = [
    {
        title: 'Configuración',
        icon: icons.menu.unSelected.settings,
        route: SETTINGS,
        group: 'admin'
    },
  
    
]

export default admin;