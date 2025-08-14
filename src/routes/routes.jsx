import { NotFound } from "../views/pages/NotFound/NotFound";
import basic from "./paths/Basic";
import auth from "./paths/Auth";
import inventory from "./paths/Inventory";
import contacts from "./paths/Contact";
import settings from "./paths/Setting";
import sales from "./paths/Sales";
import purchases from "./paths/Purchases";
import lab from "./paths/Lab";
import cashReconciliation from "./paths/CashReconciliztion";
import dev from "./paths/Dev";
import expenses from "./paths/Expenses";
import changelogs from "./paths/Changelogs"
import utility from "./paths/Utility";
import accountReceivable from './paths/AccountReceivable'
import insurance from './paths/Insurance'
import creditNote from './paths/CreditNote';
import { processRoute } from "./requiereAuthProvider";

// Procesa recursivamente las rutas y sus hijos para aplicar la protección
const processRoutes = (routes) => {
    return routes.map(route => {
        // Procesa la ruta actual
        const processedRoute = processRoute(route);
        
        // Si tiene hijos, procesa cada uno de ellos
        if (processedRoute.children && processedRoute.children.length > 0) {
            return {
                ...processedRoute,
                children: processRoutes(processedRoute.children)
            };
        }
        
        return processedRoute;
    });
};

// Lista de rutas sin procesar
const rawRoutes = [
    ...basic,
    ...auth,
    ...inventory,
    ...contacts,
    ...settings,
    ...sales,
    ...purchases,
    ...lab,
    ...cashReconciliation,
    ...expenses,
    ...dev,
    ...changelogs,
    ...utility,
    ...accountReceivable,
    ...insurance,
    ...creditNote,
    {
        path: "*",
        element: <NotFound />,
        title: "Página no encontrada",
        metaDescription: "Lo sentimos, la página que estás buscando no existe.",
        isPublic: true // NotFound debería ser accesible públicamente
    }
];

// Exporta las rutas procesadas
export const routes = processRoutes(rawRoutes);