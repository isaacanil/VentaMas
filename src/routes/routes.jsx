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
import dev from "./paths/Dev"; // Contiene rutas sólo para desarrollo (marcadas con devOnly)
import expenses from "./paths/Expenses";
import changelogs from "./paths/Changelogs";
import utility from "./paths/Utility";
import accountReceivable from './paths/AccountReceivable';
import insurance from './paths/Insurance';
import creditNote from './paths/CreditNote';
import { processRoute } from "./requiereAuthProvider";
import { ROUTE_STATUS } from './routeMeta';
import { registerRoutes } from './routeVisibility';

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

/**
 * Determina si una ruta (y sus hijos) deben incluirse según flags/env.
 * Reglas actuales:
 *  - route.devOnly === true se incluye sólo si:
 *       - import.meta.env.DEV es true, o
 *       - VITE_ENABLE_DEV_ROUTES === 'true' (permite habilitar en staging)
 *  - route.hideInProd === true se excluye únicamente cuando MODE === 'production'
 *  - route.onlyEnvs = ['development','staging'] alternativa a enabledEnvs
 *  - route.enabledEnvs (legacy) sigue funcionando
 */
const shouldIncludeRoute = (route) => {
    const isDevBuild = import.meta.env.DEV;
    const forceEnableDev = import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true';

    const status = route.status || ROUTE_STATUS.STABLE;

    // Excluir totalmente disabled
    if (status === ROUTE_STATUS.DISABLED) return false;

    const currentEnv = import.meta.env.MODE;

    // Soporte para onlyEnvs (nuevo) y enabledEnvs (anterior)
    const envList = route.onlyEnvs || route.enabledEnvs;
    if (envList && Array.isArray(envList) && envList.length > 0) {
        if (!envList.includes(currentEnv)) return false;
    }

    // Ocultar en producción si se pide explícitamente
    if (route.hideInProd && currentEnv === 'production') return false;

    // Rutas marcadas devOnly siguen la lógica anterior
    if (route.devOnly && !(isDevBuild || forceEnableDev)) return false;

    // Actualmente BETA / WIP no afectan visibilidad por sí solos; se mantienen sólo como metadatos.

    return true;
};

/**
 * Filtra recursivamente rutas según shouldIncludeRoute.
 */
const filterRoutes = (routes) => {
    return routes
        .filter(shouldIncludeRoute)
        .map(r => {
            if (r.children) {
                const children = filterRoutes(r.children);
                return { ...r, children };
            }
            return r;
        });
};

// Lista de rutas sin procesar antes del filtrado por entorno
const baseRawRoutes = [
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
    ...dev, // devOnly marcadas dentro del archivo
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

// Aplica filtrado dinámico
const rawRoutes = filterRoutes(baseRawRoutes);

// Exporta las rutas procesadas
export const routes = processRoutes(rawRoutes);
// Registrar para visibilidad en menús (evita ciclo: se hace después de construirlas)
registerRoutes(routes);