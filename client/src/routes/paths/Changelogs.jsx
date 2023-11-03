import { ChangelogList } from "../../views/controlPanel/ChangeLogControl/ChangeLogList/ChangeLogList";
import { ChangelogManage } from "../../views/controlPanel/ChangeLogControl/ChangelogManage/ChangelogManage";
import RoutesName from "../routesName"

const { CHANGELOG_LIST, CHANGELOG_MANAGE} = RoutesName.CHANGELOG_TERM;

const routes = [
    {
        path: CHANGELOG_LIST,
        element: <ChangelogList />
    },
    {

    },
    {
        path: CHANGELOG_MANAGE,
        element: <ChangelogManage />
    }
]

export  default routes;