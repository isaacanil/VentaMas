import RoutesName from "../routesName"
import { lazyImport } from "../lazyImport";

const ChangelogList = lazyImport(() => import("../../views/controlPanel/ChangeLogControl/ChangelogList/ChangelogList"), "ChangelogList");
const ChangelogManage = lazyImport(() => import("../../views/controlPanel/ChangeLogControl/ChangelogManage/ChangelogManage"), "ChangelogManage");

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
