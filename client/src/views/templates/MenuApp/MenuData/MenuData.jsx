import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import basic from './items/basic'
import sales from './items/sales'
import financialManagement from './items/financialManagement'
import inventory from './items/inventory'
import admin from './items/admin'
import contacts from './items/contacts'
import changelogs from './items/changelogs'
import utility from './items/utility'
import accountsReceivable from './items/accountsReceivable'
import { userAccess } from '../../../../hooks/abilities/useAbilities'

export const ChevronRight = <FontAwesomeIcon icon={faChevronRight} />
export const ChevronLeft = <FontAwesomeIcon icon={faChevronLeft} />

export const getMenuData = () => {
    const { abilities } = userAccess()

    const filterSubmenu = (submenu) => submenu.filter(subItem => abilities.can('access', subItem.route));

    const allMenuItems = [
        ...basic,
        ...sales,
        ...accountsReceivable,
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
                return { ...item, submenu: filteredSubmenu };
            } else {
                return null;
            }
        } else {
            return abilities.can('access', item.route) ? item : null;
        }
    }).filter(item => item !== null);

    return accessibleMenuItems
}