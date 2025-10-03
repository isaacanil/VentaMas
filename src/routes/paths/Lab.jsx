import { lazyImport } from "../lazyImport";

const Lab = lazyImport(() => import("../../Lab"), "Lab");

const routes = [
    {
        path: "/lab",
        element: <Lab/>,
    },
]
export default routes;
