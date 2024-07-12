import { faAddressBook, faAnglesLeft, faAnglesRight, faArrowDown19, faFileInvoiceDollar, faArrowDown91, faArrowDownAZ, faArrowDownShortWide, faArrowDownWideShort, faArrowDownZA, faArrowLeft, faAsterisk, faBagShopping, faBan, faBarcode, faBarsStaggered, faBold, faBox, faBoxesStacked, faBuilding, faCalendar, faCaretDown, faCaretUp, faCartFlatbed, faCartPlus, faCartShopping, faChartPie, faCheck, faChevronDown, faChevronLeft, faChevronRight, faChevronUp, faCircleCheck, faCircleInfo, faCloudArrowUp, faCompress, faCreditCard, faDivide, faDolly, faEllipsisVertical, faEnvelope, faExpand, faEye, faEyeSlash, faFilter, faGear, faGrip, faGripLines, faHashtag, faHeading, faHome, faImage, faInfo, faItalic, faListOl, faListUl, faLock, faMagnifyingGlass, faMoneyBillTransfer, faMoneyBillWave, faMultiply, faParagraph, faPencil, faPlus, faQrcode, faQuoteLeft, faReceipt, faRectangleList, faReplyAll, faRightToBracket, faSign, faSortDown, faSortUp, faSquareCaretDown, faSquareMinus, faSquarePen, faSquarePlus, faStar, faStrikethrough, faSubscript, faSubtract, faSuperscript, faTags, faTrash, faTrashCan, faTriangleExclamation, faUnderline, faUpRightAndDownLeftFromCenter, faUser, faUserCheck, faUserCog, faUserPlus, faUserTie, faUsers, faWrench, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export const icons = {
    types: {
        warning: <FontAwesomeIcon icon={faTriangleExclamation} />,
        error: <FontAwesomeIcon icon={faTrashCan} />,
        success: <FontAwesomeIcon icon={faCircleCheck} />,
        info: <FontAwesomeIcon icon={faCircleInfo} />,
        neutro: <FontAwesomeIcon icon={faStar} />,
    },
    finances: {
        money: <FontAwesomeIcon icon={faMoneyBillWave} />,
        fileInvoiceDollar:< FontAwesomeIcon icon={faFileInvoiceDollar} />,
        card: <FontAwesomeIcon icon={faCreditCard} />,
        transfer: <FontAwesomeIcon icon={faMoneyBillTransfer} />,
    },
    forms: {
        user: <FontAwesomeIcon icon={faUser} />,
        email: <FontAwesomeIcon icon={faEnvelope} />,
        password: <FontAwesomeIcon icon={faLock} />,
        asterisk: <FontAwesomeIcon icon={faAsterisk} />,
        date: <FontAwesomeIcon icon={faCalendar} />,
        search: <FontAwesomeIcon icon={faMagnifyingGlass} />,
        number: <FontAwesomeIcon icon={faHashtag} />,
        text: <FontAwesomeIcon icon={faSquareCaretDown} />,
    },
    multimedia: {
        image: <FontAwesomeIcon icon={faImage} />,
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
        arrowLeft: <FontAwesomeIcon icon={faArrowLeft} />,
        chevronDown: <FontAwesomeIcon icon={faChevronDown} />,
        chevronUp: <FontAwesomeIcon icon={faChevronUp} />,
        chevronLeft: <FontAwesomeIcon icon={faChevronLeft} />,
        chevronRight: <FontAwesomeIcon icon={faChevronRight} />,
        UpRightAndDownLeftFromCenter: <FontAwesomeIcon icon={faUpRightAndDownLeftFromCenter} />,
        arrowDownWideShort: <FontAwesomeIcon icon={faArrowDownWideShort} />,
        arrowDownShortWide: <FontAwesomeIcon icon={faArrowDownShortWide} />,
        caretUp: <FontAwesomeIcon icon={faCaretUp} />,
        caretDown: <FontAwesomeIcon icon={faCaretDown} />,
        AnglesLeft: <FontAwesomeIcon icon={faAnglesLeft} />,
        AnglesRight: <FontAwesomeIcon icon={faAnglesRight} />,
        replyAll: <FontAwesomeIcon icon={faReplyAll} />
    },
    sort: {
        sortDown: <FontAwesomeIcon icon={faSortDown} />,
        sortUp: <FontAwesomeIcon icon={faSortUp} />,
        sortAsc: <FontAwesomeIcon icon={faArrowDownAZ} />,
        sortDesc: <FontAwesomeIcon icon={faArrowDownZA} />,
        sortAscNum: <FontAwesomeIcon icon={faArrowDown19} />,
        sortDescNum: <FontAwesomeIcon icon={faArrowDown91} />,
    },
    auth: {
        login: <FontAwesomeIcon icon={faLock} />,
        signup: <FontAwesomeIcon icon={faUserPlus} />,
        logout: <FontAwesomeIcon icon={faRightToBracket} />,

    },
    fontStyles: {
        bold: <FontAwesomeIcon icon={faBold} />,
        italic: <FontAwesomeIcon icon={faItalic} />,
        underline: <FontAwesomeIcon icon={faUnderline} />,
        strikeThrough: <FontAwesomeIcon icon={faStrikethrough} />,
        subscript: <FontAwesomeIcon icon={faSubscript} />,
        superscript: <FontAwesomeIcon icon={faSuperscript} />,
        ul: <FontAwesomeIcon icon={faListUl} />,
        ol: <FontAwesomeIcon icon={faListOl} />,
        quoteLeft: <FontAwesomeIcon icon={faQuoteLeft} />,
        heading: <FontAwesomeIcon icon={faHeading} />,
        paragraph: <FontAwesomeIcon icon={faParagraph} />
    },
    editingActions:{
        star: <FontAwesomeIcon 
        icon={faStar} 

        />,
        create: <FontAwesomeIcon icon={faPlus} />,
        edit: <FontAwesomeIcon icon={faPencil} />,
        delete: <FontAwesomeIcon icon={faTrash} />,
        save: <FontAwesomeIcon icon={faCloudArrowUp} />,
        cancel: <FontAwesomeIcon icon={faXmark} />,
        accept: <FontAwesomeIcon icon={faCheck} />,
        show: <FontAwesomeIcon icon={faEye} />,
    },
    operationModes: {
        ban: <FontAwesomeIcon icon={faBan} />,
        filter: <FontAwesomeIcon icon={faFilter} />,
        sortDown: <FontAwesomeIcon icon={faSortDown} />,
        sortAsc: <FontAwesomeIcon icon={faArrowDownAZ} />,
        sortDesc: <FontAwesomeIcon icon={faArrowDownZA} />,
        sortAscNum: <FontAwesomeIcon icon={faArrowDown19} />,
        sortDescNum: <FontAwesomeIcon icon={faArrowDown91} />,
        edit: <FontAwesomeIcon icon={faPencil} />,
        add: <FontAwesomeIcon icon={faPlus} />,
        buy: <FontAwesomeIcon icon={faCartPlus} />,
        delete: <FontAwesomeIcon icon={faTrash} />,
        upload: <FontAwesomeIcon icon={faCloudArrowUp} />,
        logout: <FontAwesomeIcon icon={faRightToBracket} />,
        discard: <FontAwesomeIcon icon={faSquareMinus} />,
        save: <FontAwesomeIcon icon={faCloudArrowUp} />,
        cancel: <FontAwesomeIcon icon={faXmark} />,
        accept: <FontAwesomeIcon icon={faCheck} />,
        search: <FontAwesomeIcon icon={faMagnifyingGlass} />,
        close: <FontAwesomeIcon icon={faXmark} />,
        setting: <FontAwesomeIcon icon={faGear} />,
        setting2: <FontAwesomeIcon icon={faEllipsisVertical} />,
        setting3: <FontAwesomeIcon icon={faWrench} />,
        hide: <FontAwesomeIcon icon={faEyeSlash} />,
        more: <FontAwesomeIcon icon={faEye} />,
    },
    mathOperations: {
        add: <FontAwesomeIcon icon={faPlus} />,
        subtract: <FontAwesomeIcon icon={faSubtract} />,
        squareMinus: <FontAwesomeIcon icon={faSquareMinus} />,
        multiply: <FontAwesomeIcon icon={faMultiply} />,
        divide: <FontAwesomeIcon icon={faDivide} />,
    },
    view: {
        image: <FontAwesomeIcon icon={faImage} />,
        column: <FontAwesomeIcon icon={faGrip} />,
        row: <FontAwesomeIcon icon={faGripLines} />,
        fullScreenExpand: <FontAwesomeIcon icon={faExpand} />,
        fullScreenCompress: <FontAwesomeIcon icon={faCompress} />
    },
    menu: {
        selected: {
            home: <FontAwesomeIcon icon={faHome} />,
            sale: <FontAwesomeIcon icon={faBagShopping} />,
            purchase: <FontAwesomeIcon icon={faCartShopping} />,
            inventory: <FontAwesomeIcon icon={faCartFlatbed} />,
            contacts: <FontAwesomeIcon icon={faAddressBook} />,
            category: <FontAwesomeIcon icon={faRectangleList} />,
            register: <FontAwesomeIcon icon={faReceipt} />,
            settings: <FontAwesomeIcon icon={faGear} />,

        },
        unSelected: {
            cashReconciliation: <FontAwesomeIcon icon={faSign} />,
            expenses: {
                category: <FontAwesomeIcon icon={faTags} />,
                register: <FontAwesomeIcon icon={faSquarePlus} />,
                list: <FontAwesomeIcon icon={faSquarePen} />,
                expenses: <FontAwesomeIcon icon={faMoneyBillWave} />,
            },
            home: <FontAwesomeIcon icon={faHome} />,
            sale: <FontAwesomeIcon icon={faBagShopping} />,
            purchase: <FontAwesomeIcon icon={faCartShopping} />,
            inventory: <FontAwesomeIcon icon={faCartFlatbed} />,
            contacts: <FontAwesomeIcon icon={faAddressBook} />,
            category: <FontAwesomeIcon icon={faTags} />,
            register: <FontAwesomeIcon icon={faReceipt} />,
            settings: <FontAwesomeIcon icon={faGear} />,
        }
    },
    users: {
        provider: <FontAwesomeIcon icon={faUserTie} />,
        client: <FontAwesomeIcon icon={faUser} />,

    },
    settings: {
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