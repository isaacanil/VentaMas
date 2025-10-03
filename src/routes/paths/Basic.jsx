import ROUTES_NAME from "../routesName";
import { lazyImport } from "../lazyImport";

const Home = lazyImport(() => import("../../views/pages/Home/Home"), "Home");
const Welcome = lazyImport(() => import("../../views/pages/Welcome/Welcome"), "Welcome");

const { BASIC_TERM } = ROUTES_NAME;
const { HOME, WELCOME } = BASIC_TERM;

const Routes = [
    {
        path: WELCOME,
        element: <Welcome />,
        isPublic: true,
    },
    {
        path: HOME,
        element: <Home />,
        title: "Dashboard - Ventamax",
        metaDescription: "Resumen de estadísticas, accesos rápidos y actividades recientes en Ventamax POS.",
    }
]

export default Routes;
