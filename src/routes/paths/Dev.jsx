import RoutesName from "../routesName"
import { ROUTE_STATUS } from "../routeMeta";
import { lazyImport } from "../lazyImport";

const AllUsersControl = lazyImport(() => import("../../views/controlPanel/AllUsersControl/AllUsersControl"), "AllUsersControl");
const ChangeLogCreate = lazyImport(() => import("../../views/controlPanel/ChangeLogControl/ChangeLogCreate/ChangeLogCreate"));
const BusinessControl = lazyImport(() => import("../../views/controlPanel/CreateBusinessControl/BusinessControl"), "BusinessControl");
// const CreateBusiness = lazyImport(() => import("../../views/controlPanel/CreateBusinessControl/CreateBusiness"), "CreateBusiness");
// const Dev = lazyImport(() => import("../../views/controlPanel/Dev/Dev"), "Dev");
const BusinessCreator = lazyImport(() => import("../../views/pages/setting/subPage/BusinessEditor/BusinessCreator"));
const Doc = lazyImport(() => import("../../views/templates/system/AdvancedTable/Doc"), "Doc");
const AppConfig = lazyImport(() => import("../../views/controlPanel/AppConfig/AppConfig"));
const LoginImageConfig = lazyImport(() => import("../../views/controlPanel/AppConfig/LoginImageConfig"));
const Menu = lazyImport(() => import("../../views/templates/system/Menu/Menu"));
const FiscalReceiptsAudit = lazyImport(() => import("../../views/pages/DevTools/FiscalReceiptsAudit/FiscalReceiptsAudit"), "FiscalReceiptsAudit");
const TestPlayground = lazyImport(() => import("../../views/pages/DevTools/TestPlayground"));
const BSeriesInvoices = lazyImport(() => import("../../views/pages/DevTools/BSeriesInvoices/BSeriesInvoices"));
const InventoryMigrationTool = lazyImport(() => import("../../views/pages/DevTools/InventoryMigrationTool"));
const SyncDiagnostics = lazyImport(() => import("../../views/pages/DevTools/SyncDiagnostics"));
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
