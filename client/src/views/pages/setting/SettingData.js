import ROUTES_NAME from "../../../routes/routesName";
import findRouteByName from "../../templates/MenuApp/findRouteByName";
const { TAX_RECEIPT, BUSINESS_INFO, APP_INFO,USERS,  USERS_LIST } = ROUTES_NAME.SETTING_TERM
export const getSettingData = () => {
    return [
        {
            title: 'Datos de la Empresa',
            description: 'Completa los datos de tu organización.',
            type: 'empresa',
            category: 'Configuración de la Empresa',
            route: BUSINESS_INFO,

        },
        {
            title: 'Comprobante Fiscal',
            description: 'Configuración de comprobante fiscal.',
            type: 'fiscal',
            category: 'Configuración de la Empresa',
            route: TAX_RECEIPT,

        },
        {
            title: 'Administración de Usuarios',
            description: 'Gestiona los usuarios de tu cuenta.',
            type: 'usuarios',
            category: 'Configuración de la Empresa',
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
            category: 'Aplicación',
            route: APP_INFO,
        },


    ];
}
