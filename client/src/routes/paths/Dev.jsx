import { BusinessControl } from "../../views/controlPanel/CreateBusinessControl/BusinessControl";
import { CreateBusiness } from "../../views/controlPanel/CreateBusinessControl/CreateBusiness";
import { Dev } from "../../views/controlPanel/Dev/Dev";
import { Table } from "../../views/controlPanel/Table/Table";
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
        path: '/table',
        element: <Table/>
    }
]
export default routes;