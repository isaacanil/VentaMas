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

export const ChevronRight = <FontAwesomeIcon icon={faChevronRight} />
export const ChevronLeft = <FontAwesomeIcon icon={faChevronLeft} />

export const getMenuData = () => {
    return [
        ...basic,
        ...sales,
        ...inventory,
        ...financialManagement,
        ...utility,
        ...contacts,
        ...admin,
        ...changelogs,

    ]
}