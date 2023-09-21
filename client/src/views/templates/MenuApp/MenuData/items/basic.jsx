import { icons } from "../../../../../constants/icons/icons";
import ROUTES_NAME  from "../../../../../routes/routesName";

const { HOME, WELCOME } = ROUTES_NAME.BASIC_TERM

const basic = [
    {
        title: 'Inicio',
        icon: icons.menu.unSelected.home,
        route: HOME,
        group: 'basic'
    },
]

export default basic;