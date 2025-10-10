import { AllUsersControl } from "../../views/controlPanel/AllUsersControl/AllUsersControl";
import AppConfig from "../../views/controlPanel/AppConfig/AppConfig";
import LoginImageConfig from "../../views/controlPanel/AppConfig/LoginImageConfig";
import ChangeLogCreate from "../../views/controlPanel/ChangeLogControl/ChangeLogCreate/ChangeLogCreate";
import { BusinessControl } from "../../views/controlPanel/CreateBusinessControl/BusinessControl";
import BSeriesInvoices from "../../views/pages/DevTools/BSeriesInvoices/BSeriesInvoices";
import { FiscalReceiptsAudit } from "../../views/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit";
import InventoryMigrationTool from "../../views/pages/DevTools/InventoryMigrationTool";
import SyncDiagnostics from "../../views/pages/DevTools/SyncDiagnostics";
import TestPlayground from "../../views/pages/DevTools/TestPlayground";
import BusinessCreator from "../../views/pages/setting/subPage/BusinessEditor/BusinessCreator";
import { Doc } from "../../views/templates/system/AdvancedTable/Doc";
import Menu from "../../views/templates/system/Menu/Menu";
import { ROUTE_STATUS } from "../routeMeta";
import RoutesName from "../routesName"

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
        path: RoutesName.DEV_VIEW_TERM.B_SERIES_INVOICES,
        element: <BSeriesInvoices />,
        status: ROUTE_STATUS.BETA,
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
