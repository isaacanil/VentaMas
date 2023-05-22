import { faAddressBook, faBagShopping, faBarsStaggered, faBox, faBoxesStacked, faCartFlatbed, faCartShopping, faChartPie, faCheck, faCloudArrowUp, faCompress, faDivide, faDolly, faEnvelope, faExpand, faGear, faGrip, faGripLines, faHome, faImage, faLock, faMagnifyingGlass, faMultiply, faPencil, faPlus, faReceipt, faRectangleList, faSquareCaretDown, faSquareMinus, faSquarePen, faSubtract, faTrash, faTrashCan, faUser, faUserPlus, faUserTie, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const icons = {
    forms: {
        user: <FontAwesomeIcon icon={faUser} />,
        email: <FontAwesomeIcon icon={faEnvelope} />,
        password: <FontAwesomeIcon icon={faLock} />,

    },
    user: {
        create: <FontAwesomeIcon icon={faUserPlus} />,
        users: <FontAwesomeIcon icon={faUsers} />
    },
    operationModes: {
        edit: <FontAwesomeIcon icon={faPencil} />,
        add: <FontAwesomeIcon icon={faPlus} />,
        delete: <FontAwesomeIcon icon={faTrash}  />,
        discard: <FontAwesomeIcon icon={faSquareMinus} />,
        save: <FontAwesomeIcon icon={faCloudArrowUp} />,
        cancel: <FontAwesomeIcon icon={faXmark} />,
        accept: <FontAwesomeIcon icon={faCheck} />,
        search: <FontAwesomeIcon icon={faMagnifyingGlass} />,
    },
    mathOperations: {
        add: <FontAwesomeIcon icon={faPlus} />,
        subtract: <FontAwesomeIcon icon={faSubtract} />,
        multiply: <FontAwesomeIcon icon={faMultiply} />,
        divide: <FontAwesomeIcon icon={faDivide} />,
    },
    view:{
        image: <FontAwesomeIcon icon={faImage} />,
        column: <FontAwesomeIcon icon={faGrip} />,
        row: <FontAwesomeIcon icon={faGripLines} />,
        fullScreenExpand: <FontAwesomeIcon icon={faExpand} />,
        fullScreenCompress: <FontAwesomeIcon icon={faCompress} />
    },
    menu:{
        selected: {
            home: <FontAwesomeIcon icon={faHome} />,
            sale: <FontAwesomeIcon icon={faBagShopping} />,
            purchase: <FontAwesomeIcon icon={faCartShopping} />,
            inventory: <FontAwesomeIcon icon={faCartFlatbed} />,
            contacts: <FontAwesomeIcon icon={faAddressBook} />,
            category:<FontAwesomeIcon icon={faRectangleList} />,
            register: <FontAwesomeIcon icon={faReceipt} />,
            settings:<FontAwesomeIcon icon={faGear} />,
        },
        unSelected: {
            home: <FontAwesomeIcon icon={faHome} />,
            sale: <FontAwesomeIcon icon={faBagShopping} />,
            purchase: <FontAwesomeIcon icon={faCartShopping} />,
            inventory: <FontAwesomeIcon icon={faCartFlatbed} />,
            contacts: <FontAwesomeIcon icon={faAddressBook} />,
            category:<FontAwesomeIcon icon={faRectangleList} />,
            register: <FontAwesomeIcon icon={faReceipt} />,
            settings:<FontAwesomeIcon icon={faGear} />,
        }
    },
    users:{
        provider: <FontAwesomeIcon icon={faUserTie} />,
        client: <FontAwesomeIcon icon={faUser} />,
    },
    inventory: {
        items: <FontAwesomeIcon icon={faBoxesStacked} />,
        services: <FontAwesomeIcon icon={faBarsStaggered} />,
        productOutFlow: <FontAwesomeIcon icon={faSquareCaretDown} />,
        multimediaManager: <FontAwesomeIcon icon={faImage} />,
    }
  
  
}