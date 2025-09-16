import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME from "../../../../../routes/routesName";

const { SETTING } = ROUTES_NAME.SETTING_TERM
const { AUTHORIZATIONS_LIST } = ROUTES_NAME.AUTHORIZATIONS_TERM

const admin = [
  {
      title: 'Configuración',
      icon: icons.menu.unSelected.settings,
      route: SETTING,
      group: 'admin'
  },
  {
      title: 'Autorizaciones',
      icon: icons.menu.unSelected.settings,
      route: AUTHORIZATIONS_LIST,
      group: 'admin'
  },
  
    
]

export default admin;
