import ROUTES_NAME from "../routesName";
import { lazyImport } from "../lazyImport";

const Utility = lazyImport(() => import("../../views/pages/Utility/Utility"), "Utility");

const {
    UTILITY,
    UTILITY_REPORT
} = ROUTES_NAME.UTILITY_TERM;


const Routes = [
    { path: UTILITY_REPORT, element: <Utility /> },
]

export default Routes;
