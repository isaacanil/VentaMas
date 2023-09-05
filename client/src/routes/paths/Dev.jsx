import { BusinessControl } from "../../views/controlPanel/CreateBusinessControl/BusinessControl";
import { CreateBusiness } from "../../views/controlPanel/CreateBusinessControl/CreateBusiness";
import { Dev } from "../../views/controlPanel/Dev/Dev";
import { Doc } from "../../views/controlPanel/Table/Doc";
import Menu from "../../views/templates/system/Menu/Menu";
import { Prueba } from "../../views/templates/system/Menu/Prueba";

import RoutesName from "../routesName"
const { CREATE_BUSINESS, MANAGE_BUSINESS } = RoutesName.DEV_VIEW_TERM
const routes = [
    {
        path: MANAGE_BUSINESS,
        element: <BusinessControl />,
    },
    {
        path: CREATE_BUSINESS,
        element: <CreateBusiness />,
    },
    {
        path: '/doc',
        element: <Doc/>
    },
    {
        path: '/menu',
        element: <Menu />,
    },
    {
        path: '/prueba',
        element: <Prueba />,
    }
]
export default routes;