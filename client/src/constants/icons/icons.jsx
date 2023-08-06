import { faAddressBook, faAnglesLeft, faAnglesRight, faArrowDown19, faArrowDown91, faArrowDownAZ, faArrowDownShortWide, faArrowDownWideShort, faArrowDownZA, faBagShopping, faBarcode, faBarsStaggered, faBox, faBoxesStacked, faBuilding, faCaretDown, faCaretUp, faCartFlatbed, faCartShopping, faChartPie, faCheck, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCloudArrowUp, faCompress, faDivide, faDolly, faEllipsisVertical, faEnvelope, faExpand, faEye, faEyeSlash, faFilter, faGear, faGrip, faGripLines, faHome, faImage, faInfo, faLock, faMagnifyingGlass, faMultiply, faPencil, faPlus, faQrcode, faReceipt, faRectangleList, faSign, faSortDown, faSortUp, faSquareCaretDown, faSquareMinus, faSquarePen, faSubtract, faTrash, faTrashCan, faUpRightAndDownLeftFromCenter, faUser, faUserCheck, faUserCog, faUserPlus, faUserTie, faUsers, faWrench, faXmark } from "@fortawesome/free-solid-svg-icons";
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
        arrowDownWideShort :<FontAwesomeIcon icon={faArrowDownWideShort} />,
        arrowDownShortWide: <FontAwesomeIcon icon={faArrowDownShortWide} />,
        caretUp: <FontAwesomeIcon icon={faCaretUp} />,
        caretDown: <FontAwesomeIcon icon={faCaretDown} />,
        AnglesLeft: <FontAwesomeIcon icon={faAnglesLeft} />,
        AnglesRight: <FontAwesomeIcon icon={faAnglesRight} />
    },
    sort:{
        sortDown: <FontAwesomeIcon icon={faSortDown} />,
        sortUp: <FontAwesomeIcon icon={faSortUp} />,
        sortAsc: <FontAwesomeIcon icon={faArrowDownAZ} />,
        sortDesc: <FontAwesomeIcon icon={faArrowDownZA} />,
        sortAscNum: <FontAwesomeIcon icon={faArrowDown19} />,
        sortDescNum: <FontAwesomeIcon icon={faArrowDown91} />,
    },
    operationModes: {
        filter: <FontAwesomeIcon icon={faFilter} />,
        sortDown: <FontAwesomeIcon icon={faSortDown} />,
        sortAsc: <FontAwesomeIcon icon={faArrowDownAZ} />,
        sortDesc: <FontAwesomeIcon icon={faArrowDownZA} />,
        sortAscNum: <FontAwesomeIcon icon={faArrowDown19} />,
        sortDescNum: <FontAwesomeIcon icon={faArrowDown91} />,
        edit: <FontAwesomeIcon icon={faPencil} />,
        add: <FontAwesomeIcon icon={faPlus} />,
        delete: <FontAwesomeIcon icon={faTrash}  />,
        discard: <FontAwesomeIcon icon={faSquareMinus} />,
        save: <FontAwesomeIcon icon={faCloudArrowUp} />,
        cancel: <FontAwesomeIcon icon={faXmark} />,
        accept: <FontAwesomeIcon icon={faCheck} />,
        search: <FontAwesomeIcon icon={faMagnifyingGlass} />,
        close: <FontAwesomeIcon icon={faXmark} />,
        setting: <FontAwesomeIcon icon={faGear} />,
        setting2: <FontAwesomeIcon icon={faEllipsisVertical} />,
        setting3: <FontAwesomeIcon icon={faWrench} />,
    },
    mathOperations: {
        add: <FontAwesomeIcon icon={faPlus} />,
        subtract: <FontAwesomeIcon icon={faSubtract} />,
        squareMinus: <FontAwesomeIcon icon={faSquareMinus} />,
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
    settings:{
        businessInfo: <FontAwesomeIcon icon={faBuilding} />,
        taxReceipt: <FontAwesomeIcon icon={faReceipt} />,
        appInfo: <FontAwesomeIcon icon={faInfo} />,
        users: <FontAwesomeIcon icon={faUserCog} />,
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