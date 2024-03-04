import { faChevronLeft, faChevronRight, faClipboard, faClipboardCheck } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { icons } from '../../../../constants/icons/icons'
import findRouteByName from '../findRouteByName'
import ROUTES_NAME from '../../../../routes/routesName'
import basic from './items/basic'
import sales from './items/sales'
import financialManagement from './items/financialManagement'
import inventory from './items/inventory'
import admin from './items/admin'
import contacts from './items/contacts'
import changelogs from './items/changelogs'
import utility from './items/utility'
import { userAccess } from '../../../../hooks/abilities/useAbilities'

export const ChevronRight = <FontAwesomeIcon icon={faChevronRight} />
export const ChevronLeft = <FontAwesomeIcon icon={faChevronLeft} />

// Filtrar elementos del menú basado en las habilidades




export const getMenuData = () => {
    const { abilities } = userAccess()
    const filterSubmenu = (submenu) => submenu.filter(subItem => abilities.can('access', subItem.route));
    const allMenuItems = [
        ...basic,
        ...sales,
        ...inventory,
        ...financialManagement,
        ...utility,
        ...contacts,
        ...admin,
        ...changelogs,
    ]
    const accessibleMenuItems = allMenuItems.map(item => {
        if (item.submenu && item.submenu.length > 0) {

            const filteredSubmenu = filterSubmenu(item.submenu);
            if (filteredSubmenu.length > 0) {
                // Si el submenú tiene elementos accesibles, retornar el elemento de menú con el submenú filtrado
                return { ...item, submenu: filteredSubmenu };
            } else {
                // Si el submenú está vacío después del filtro, no incluir este elemento de menú
                return null;
            }
        } else {
            // Si no tiene submenú, verificar si el usuario puede acceder a este elemento de menú
            return abilities.can('access', item.route) ? item : null;
        }
    }).filter(item => item !== null); // Eliminar elementos nulos después del mapeo
    return accessibleMenuItems
}