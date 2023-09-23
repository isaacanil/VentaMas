import { ChangelogList } from "../../views/controlPanel/ChangeLogControl/ChangeLogList/ChangeLogList";
import RoutesName from "../routesName"

const { CHANGELOG_LIST} = RoutesName.CHANGELOG_TERM;

const routes = [
    {
        path: CHANGELOG_LIST,
        element: <ChangelogList />
    }
]

export  default routes;