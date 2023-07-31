import { faAddressBook, faBagShopping, faBarcode, faBarsStaggered, faBox, faBoxesStacked, faCartFlatbed, faCartShopping, faChartPie, faCheck, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCloudArrowUp, faCompress, faDivide, faDolly, faEnvelope, faExpand, faEye, faEyeSlash, faFilter, faGear, faGrip, faGripLines, faHome, faImage, faLock, faMagnifyingGlass, faMultiply, faPencil, faPlus, faQrcode, faReceipt, faRectangleList, faSign, faSquareCaretDown, faSquareMinus, faSquarePen, faSubtract, faTrash, faTrashCan, faUpRightAndDownLeftFromCenter, faUser, faUserCheck, faUserPlus, faUserTie, faUsers, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const icons = {
    forms: {
        user: <FontAwesomeIcon icon={faUser} />,
        email: <FontAwesomeIcon icon={faEnvelope} />,
        password: <FontAwesomeIcon icon={faLock} />,

    },
    user: {
        create: <FontAwesomeIcon icon={faUserPlus} />,
        users: <FontAwesomeIcon icon={faUsers} />,
        user: <FontAwesomeIcon icon={faUser} />,
        userCheck: <FontAwesomeIcon icon={faUserCheck} />,
    },
    input: {
        password: {
            show: <FontAwesomeIcon icon={faEye} />,
            hide: <FontAwesomeIcon icon={faEyeSlash} />,
        }
    },
    arrows: {
        chevronDown: <FontAwesomeIcon icon={faChevronDown} />,
        chevronUp: <FontAwesomeIcon icon={faChevronUp} />,
        chevronLeft: <FontAwesomeIcon icon={faChevronLeft} />,
        chevronRight: <FontAwesomeIcon icon={faChevronRight} />,
        UpRightAndDownLeftFromCenter: <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />,
    },
    operationModes: {
        filter: <FontAwesomeIcon icon={faFilter} />,
        edit: <FontAwesomeIcon icon={faPencil} />,
        add: <FontAwesomeIcon icon={faPlus} />,
        delete: <FontAwesomeIcon icon={faTrash}  />,
        discard: <FontAwesomeIcon icon={faSquareMinus} />,
        save: <FontAwesomeIcon icon={faCloudArrowUp} />,
        cancel: <FontAwesomeIcon icon={faXmark} />,
        accept: <FontAwesomeIcon icon={faCheck} />,
        search: <FontAwesomeIcon icon={faMagnifyingGlass} />,
        close: <FontAwesomeIcon icon={faXmark} />,
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
            cashReconciliation: <FontAwesomeIcon icon={faSign} />,
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
        barcode: <FontAwesomeIcon icon={faBarcode} />,
        qrcode: <FontAwesomeIcon icon={faQrcode} />,
    },
  
  
}