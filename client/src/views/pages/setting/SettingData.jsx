import { icons } from "../../../constants/icons/icons";
import ROUTES_NAME from "../../../routes/routesName";
import findRouteByName from "../../templates/MenuApp/findRouteByName";
const { TAX_RECEIPT, BUSINESS_INFO, APP_INFO,USERS,  USERS_LIST } = ROUTES_NAME.SETTING_TERM
const category = {
    BUSINESS_INFO: 'Configuración de la Empresa',
    APP_INFO: 'Aplicación',
}
export const getSettingData = () => {
    return [
        {
            title: 'Datos de la Empresa',
            description: 'Completa los datos de tu organización.',
            type: 'empresa',
            icon: icons.settings.businessInfo,
            category: category.BUSINESS_INFO,
            route: BUSINESS_INFO,

        },
        {
            title: 'Comprobante Fiscal',
            description: 'Configuración de comprobante fiscal.',
            type: 'fiscal',
            icon: icons.settings.taxReceipt,
            category: category.BUSINESS_INFO,
            route: TAX_RECEIPT,

        },
        {
            title: 'Administración de Usuarios',
            description: 'Gestiona los usuarios de tu cuenta.',
            type: 'usuarios',
            icon: icons.settings.users,
            category: category.BUSINESS_INFO,
            route: '/users/list',
        },
        // {
        //     title: 'Enviar Comentarios',
        //     description: 'Enviar Reporte de Errores y Sugerencias',
        //     type: 'feedback',
        //     category: 'Aplicación',
        //     path: '/app/feedback',
        // },
        {
            title: 'Información de la Aplicación',
            description: 'Consulta detalles sobre la aplicación.',
            type: 'aplicación',
            icon: icons.settings.appInfo,
            category: category.APP_INFO,
            route: APP_INFO,
        },


    ];
}
