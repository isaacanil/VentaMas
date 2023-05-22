import { icons } from "../../../../../../../constants/icons/icons"
import ROUTES_NAME from "../../../../../../../routes/routesName"
import findRouteByName from "../../../../../../templates/MenuApp/findRouteByName"

const {USERS, USERS_LIST, CREATE_USER} = ROUTES_NAME.SETTING_TERM

export const getMenuData = () => {
    return [
        {
            title: 'Crear Usuario',
            icon: icons.user.create,
            route: findRouteByName(CREATE_USER)
        },
        {
            title: 'Usuarios',
            icon: icons.user.users,
            route: findRouteByName(USERS_LIST)
        },
    ]
}