import { AllUsersControl } from "../../views/controlPanel/AllUsersControl/AllUsersControl";
import ChangeLogCreate from "../../views/controlPanel/ChangeLogControl/ChangeLogCreate/ChangeLogCreate";
import { BusinessControl } from "../../views/controlPanel/CreateBusinessControl/BusinessControl";
import { CreateBusiness } from "../../views/controlPanel/CreateBusinessControl/CreateBusiness";
import { Dev } from "../../views/controlPanel/Dev/Dev";
import BusinessCreator from "../../views/pages/setting/subPage/BusinessEditor/BusinessCreator";
import { Doc } from "../../views/templates/system/AdvancedTable/Doc";
import AppConfig from "../../views/controlPanel/AppConfig/AppConfig";
import LoginImageConfig from "../../views/controlPanel/AppConfig/LoginImageConfig";

import Menu from "../../views/templates/system/Menu/Menu";
import { FiscalReceiptsAudit } from "../../views/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit";
import TestPlayground from "../../views/pages/DevTools/TestPlayground";

import RoutesName from "../routesName"
import InventoryMigrationTool from "../../views/pages/DevTools/InventoryMigrationTool";
import SyncDiagnostics from "../../views/pages/DevTools/SyncDiagnostics";
import { ROUTE_STATUS } from "../routeMeta";
const { CREATE_BUSINESS, BUSINESSES, CHANGELOG_CREATE, CHANGELOG_MANAGE, ALL_USERS, APP_CONFIG, INVENTORY_MIGRATION, SYNC_DIAGNOSTICS } = RoutesName.DEV_VIEW_TERM;

// Todas estas rutas se consideran de desarrollo; se filtrarán en producción salvo que se active VITE_ENABLE_DEV_ROUTES
// Puedes granular alguna con enabledEnvs: ['development','staging'] si quieres que salga en staging únicamente.
const routes = [
    {
        path: BUSINESSES,
        element: <BusinessControl />,
        status: ROUTE_STATUS.WIP,
    },
    {
        path: CREATE_BUSINESS,
        element: <BusinessCreator />,
        devOnly: true,
    },
    {
        path: '/doc',
        element: <Doc/> ,
        devOnly: true,
        status: ROUTE_STATUS.BETA,
    },
    {
        path: '/menu',
        element: <Menu />,
        devOnly: true,
    },
    {
        path: RoutesName.DEV_VIEW_TERM.FISCAL_RECEIPTS_AUDIT,
        element: <FiscalReceiptsAudit />,
        // enabledEnvs: ['development'] // Ejemplo: sólo en dev incluso si se fuerza dev routes en staging
    },
    {
        path: RoutesName.DEV_VIEW_TERM.PRUEBA,
        element: <TestPlayground />,
    },
    {
        path: INVENTORY_MIGRATION,
        element: <InventoryMigrationTool />,
        devOnly: true,
        status: ROUTE_STATUS.WIP,
        // Para habilitar en staging usar VITE_ENABLE_DEV_ROUTES=true
        // enabledEnvs: ['development']
    },
    {
        path: SYNC_DIAGNOSTICS,
        element: <SyncDiagnostics />,
        devOnly: true,
        status: ROUTE_STATUS.WIP,
    },
    {
        path: ALL_USERS,
        element: <AllUsersControl />,
        devOnly: true,
        status: ROUTE_STATUS.BETA,
    },
    {
        path: CHANGELOG_CREATE,
        element: <ChangeLogCreate />,
        devOnly: true,
    },
    {
        path: APP_CONFIG.ROOT,
        element: <AppConfig />,
        devOnly: true,
    },
    {
        path: APP_CONFIG.LOGIN_IMAGE,
        element: <LoginImageConfig />,
        devOnly: true,
    }
];
export default routes;
