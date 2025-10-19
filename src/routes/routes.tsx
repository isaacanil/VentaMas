import type { ReactElement } from 'react';

import { NotFound } from "../views/pages/NotFound/NotFound";

import accountReceivable from './paths/AccountReceivable';
import auth from "./paths/Auth";
import authorizations from './paths/Authorizations';
import basic from "./paths/Basic";
import cashReconciliation from "./paths/CashReconciliztion";
import changelogs from "./paths/Changelogs";
import contacts from "./paths/Contact";
import creditNote from './paths/CreditNote';
import dev from "./paths/Dev"; // Contiene rutas sólo para desarrollo (marcadas con devOnly)
import expenses from "./paths/Expenses";
import insurance from './paths/Insurance';
import inventory from "./paths/Inventory";
import lab from "./paths/Lab";
import purchases from "./paths/Purchases";
import sales from "./paths/Sales";
import settings from "./paths/Setting";
import utility from "./paths/Utility";
import { processRoute } from "./requiereAuthProvider";
import { ROUTE_STATUS } from './routeMeta';
import type { RouteStatus } from './routeMeta';
import { registerRoutes as registerRoutesIndex } from './routeVisibility';

export interface AppRoute {
    path: string;
    element: ReactElement;
    children?: AppRoute[];
    title?: string;
    metaDescription?: string;
    isPublic?: boolean;
    hideInProd?: boolean;
    devOnly?: boolean;
    hideInMenu?: boolean;
    status?: RouteStatus;
    onlyEnvs?: string[];
    enabledEnvs?: string[];
    // Algunas rutas traen propiedades adicionales (ej. name); se permiten sin tipar estrictamente.
    [key: string]: unknown;
}

const registerRoutes = registerRoutesIndex as (routes: AppRoute[]) => void;

// Procesa recursivamente las rutas y sus hijos para aplicar la protección
const processRoutes = (routes: AppRoute[]): AppRoute[] => {
    return routes.map((route) => {
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
const shouldIncludeRoute = (route: AppRoute): boolean => {
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
const filterRoutes = (routes: AppRoute[]): AppRoute[] => {
    return routes
        .filter(shouldIncludeRoute)
        .map((r) => {
            if (r.children) {
                const children = filterRoutes(r.children);
                return { ...r, children };
            }
            return r;
        });
};

// Lista de rutas sin procesar antes del filtrado por entorno
const baseRawRoutes = [
    ...(basic as AppRoute[]),
    ...(auth as AppRoute[]),
    ...(inventory as AppRoute[]),
    ...(contacts as AppRoute[]),
    ...(settings as AppRoute[]),
    ...(sales as AppRoute[]),
    ...(purchases as AppRoute[]),
    ...(lab as AppRoute[]),
    ...(cashReconciliation as AppRoute[]),
    ...(expenses as AppRoute[]),
    ...(dev as AppRoute[]), // devOnly marcadas dentro del archivo
    ...(changelogs as AppRoute[]),
    ...(utility as AppRoute[]),
    ...(accountReceivable as AppRoute[]),
    ...(insurance as AppRoute[]),
    ...(creditNote as AppRoute[]),
    ...(authorizations as AppRoute[]),
    {
        path: "*",
        element: <NotFound />,
        title: "Página no encontrada",
        metaDescription: "Lo sentimos, la página que estás buscando no existe.",
        isPublic: true // NotFound debería ser accesible públicamente
    }
] satisfies AppRoute[];

// Aplica filtrado dinámico
const rawRoutes = filterRoutes(baseRawRoutes);

// Exporta las rutas procesadas
export const routes = processRoutes(rawRoutes);
// Registrar para visibilidad en menús (evita ciclo: se hace después de construirlas)
registerRoutes(routes);
