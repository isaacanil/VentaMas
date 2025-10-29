import { EyeOutlined, MoreOutlined, PrinterOutlined, ShoppingCartOutlined } from "@ant-design/icons";
import * as antd from "antd";
import { useState, useCallback, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";

import { icons } from "../../../../../constants/icons/icons";
import { selectBusinessData } from "../../../../../features/auth/businessSlice";
import { selectUser } from "../../../../../features/auth/userSlice";
import { loadCart, setCartId, toggleInvoicePanelOpen, SelectSettingCart } from "../../../../../features/cart/cartSlice";
import { selectTaxReceiptType } from "../../../../../features/taxReceipt/taxReceiptSlice";
import { selectClientWithAuth } from "../../../../../features/clientCart/clientCartSlice";
import { fbCancelPreorder } from "../../../../../firebase/invoices/fbCancelPreorder";
import { downloadInvoiceLetterPdf } from "../../../../../firebase/quotation/downloadQuotationPDF";
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { getTimeElapsed } from "../../../../../hooks/useFormatTime";
import { validateInvoiceCart } from "../../../../../utils/invoiceValidation";
import { Invoice } from "../../../../component/Invoice/components/Invoice/Invoice";
import { ConfirmModal } from "../../../../component/modals/ConfirmModal/ConfirmModal";
import PreorderModal from "../../../../component/modals/PreorderModal/PreorderModal";
import { Tag } from "../../../../templates/system/Tag/Tag";

const resolvePreorderTaxReceiptType = (preorder) =>
    preorder?.selectedTaxReceiptType ??
    preorder?.preorderDetails?.selectedTaxReceiptType ??
    preorder?.preorderDetails?.taxReceipt?.type ??
    null;

// Cell renderer components to avoid hook violations
const PriceCell = ({ value }) => {
    return <span>{useFormatPrice(value)}</span>;
};

const DateCell = ({ value }) => {
    const time = value * 1000;
    return <span>{getTimeElapsed(time, 0)}</span>;
};

const StatusCell = ({ value }) => {
    const getColorByStatus = (status) => {
        const statusColors = {
            pending: 'orange',
            completed: 'green',
            cancelled: 'red',
        };
        return statusColors[status] || 'gray';
    };

    const statusLabel = value === 'pending' ? 'Pendiente' : value === 'completed' ? 'Completada' : 'Cancelada';
    return <Tag color={getColorByStatus(value)}>{statusLabel}</Tag>;
};

const EditButton = ({ value }) => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const data = value.data;
    const user = useSelector(selectUser);
    const business = useSelector(selectBusinessData) || {};
    const cartSettings = useSelector(SelectSettingCart);
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
    const [isPreorderModalOpen, setIsPreorderModalOpen] = useState(false);
    const printRef = useRef(null);

    const printablePreorder = useMemo(() => {
        if (!data) return null;
        return {
            ...data,
            numberID: data?.numberID || data?.preorderDetails?.numberID,
            date: data?.date || data?.preorderDetails?.date || null,
            copyType: data?.copyType || 'PREVENTA',
            type: data?.type || 'preorder',
        };
    }, [data]);

    const resolvedInvoiceType = useMemo(() => {
        const type =
            cartSettings?.billing?.invoiceType ||
            printablePreorder?.billing?.invoiceType ||
            printablePreorder?.invoiceType ||
            null;

        return type ? type.toLowerCase() : null;
    }, [cartSettings?.billing?.invoiceType, printablePreorder]);

    const triggerPrint = useReactToPrint({
        content: () => printRef.current,
    });

    const convertTimestampsToMillis = useCallback((obj) => {
        if (!obj || typeof obj !== 'object') return obj;

        if (Array.isArray(obj)) {
            return obj.map(item => convertTimestampsToMillis(item));
        }

        const converted = {};
        Object.keys(obj).forEach((key) => {
            const value = obj[key];

            if (
                value &&
                typeof value === 'object' &&
                value.seconds !== undefined &&
                value.nanoseconds !== undefined
            ) {
                converted[key] = value.seconds * 1000 + Math.floor(value.nanoseconds / 1000000);
            } else if (value && typeof value === 'object') {
                converted[key] = convertTimestampsToMillis(value);
            } else {
                converted[key] = value;
            }
        });

        return converted;
    }, []);

    const printableInvoiceData = useMemo(() => {
        const source = printablePreorder || data;
        if (!source) return null;
        return convertTimestampsToMillis(source) ?? source;
    }, [convertTimestampsToMillis, data, printablePreorder]);

    const handlePrintPreorder = useCallback(async () => {
        if (!printablePreorder) {
            antd.notification.warning({
                message: 'No se puede imprimir la preventa',
                description: 'Los datos de la preventa no están disponibles para imprimir.'
            });
            return;
        }
        const printableData = printableInvoiceData ?? convertTimestampsToMillis(printablePreorder) ?? printablePreorder;

        if (resolvedInvoiceType === 'template2') {
            try {
                await downloadInvoiceLetterPdf(business, printableData);
            } catch (err) {
                console.error('[PreSaleTable] downloadInvoiceLetterPdf failed', err);
                antd.notification.error({
                    message: 'Error al imprimir',
                    description: err?.message || 'No se pudo generar el PDF de la preventa.'
                });
            }
            return;
        }

        triggerPrint();
    }, [business, convertTimestampsToMillis, downloadInvoiceLetterPdf, printableInvoiceData, printablePreorder, resolvedInvoiceType, triggerPrint]);

    const handlePreloadPreorder = useCallback(() => {
        if (!data) return;

        const { isValid, message } = validateInvoiceCart(data);
        if (!isValid) {
            antd.notification.warning({
                message: 'No se pudo precargar la preventa',
                description: message || 'Verifica el contenido antes de continuar.'
            });
            return;
        }

        const serializedPreorder = convertTimestampsToMillis(data);

        dispatch(loadCart(serializedPreorder));
        dispatch(setCartId());
        const storedTaxReceiptType = resolvePreorderTaxReceiptType(serializedPreorder);
        if (storedTaxReceiptType) {
            dispatch(selectTaxReceiptType(storedTaxReceiptType));
        }

        if (serializedPreorder?.client) {
            dispatch(selectClientWithAuth(serializedPreorder.client));
        }

        const params = new URLSearchParams();
        params.set('mode', 'preorder');
        if (serializedPreorder?.id) {
            params.set('preorderId', serializedPreorder.id);
        }
        params.set('preserveCart', '1');

        navigate({ pathname: '/sales', search: `?${params.toString()}` });

        antd.notification.success({
            message: 'Preventa precargada',
            description: `Se cargó la preventa ${serializedPreorder?.preorderDetails?.numberID || ''} en ventas.`
        });
    }, [convertTimestampsToMillis, data, dispatch, navigate]);

    const handleCancelPreorder = async () => {
        try {
            await fbCancelPreorder(user, data);
            setIsCancelConfirmOpen(false);
        } catch (err) {
            antd.notification.error({
                message: 'No se pudo cancelar la preventa',
                description: err?.message || 'Intenta nuevamente.'
            });
        }
    };

    const handleInvoicePanelOpen = () => {
        if (!data) return;

        const { isValid, message } = validateInvoiceCart(data);
        if (isValid) {
            const serializedPreorder = convertTimestampsToMillis(data);

            dispatch(loadCart(serializedPreorder));
            dispatch(setCartId());
            const storedTaxReceiptType = resolvePreorderTaxReceiptType(serializedPreorder);
            if (storedTaxReceiptType) {
                dispatch(selectTaxReceiptType(storedTaxReceiptType));
            }
            if (serializedPreorder?.client) {
                dispatch(selectClientWithAuth(serializedPreorder.client));
            }
            dispatch(toggleInvoicePanelOpen());
        } else {
            antd.notification.error({
                description: message
            });
        }
    };

    const menuItems = [
        {
            key: 'view',
            label: 'Ver',
            onClick: () => setIsPreorderModalOpen(true),
            icon: <EyeOutlined />,
        },
        {
            key: 'preload',
            label: 'Precargar en Ventas',
            onClick: handlePreloadPreorder,
            icon: <ShoppingCartOutlined />,
        },
        {
            key: 'complete',
            label: 'Completar preventa',
            onClick: handleInvoicePanelOpen,
            icon: icons.editingActions.complete,
        },
        {
            key: 'print',
            label: 'Imprimir',
            onClick: handlePrintPreorder,
            icon: <PrinterOutlined />,
        },
        {
            key: 'cancel',
            label: 'Cancelar',
            onClick: () => setIsCancelConfirmOpen(true),
            icon: icons.editingActions.cancel,
            danger: true,
        }
    ];


    return (
        <div
            style={{
                display: 'flex',
                gap: '10px',
                alignItems: 'center'
            }}
            onClick={(e) => e.stopPropagation()}
        >
            <div style={{ position: 'absolute', top: -9999, left: -9999 }} aria-hidden="true">
                <Invoice ref={printRef} data={printableInvoiceData || printablePreorder || data} ignoreHidden />
            </div>
            <antd.Tooltip title="Precargar en Ventas">
                <antd.Button
                    icon={<ShoppingCartOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePreloadPreorder();
                    }}
                />
            </antd.Tooltip>
            <antd.Tooltip title="Completar preventa">
                <antd.Button
                    icon={icons.editingActions.complete}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleInvoicePanelOpen();
                    }}
                />
            </antd.Tooltip>
            
            <antd.Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <antd.Button 
                    icon={<MoreOutlined />} 
                    onClick={(e) => e.stopPropagation()}
                />
            </antd.Dropdown>

            <PreorderModal 
                preorder={data} 
                open={isPreorderModalOpen} 
                onCancel={() => setIsPreorderModalOpen(false)} 
            />
            <ConfirmModal
                open={isCancelConfirmOpen}
                onConfirm={() => handleCancelPreorder()}
                onCancel={() => setIsCancelConfirmOpen(false)}
                title="Cancelar Preorden"
                message={`¿Estás seguro de que deseas cancelar la preorden ${data?.preorderDetails?.numberID} para el cliente ${data?.client?.name}?`}
                confirmText="Cancelar Preorden"
                cancelText="Volver"
                danger
                data={data?.preorderDetails?.numberID}
            />
        </div>
    );
};
const getColorByStatus = (status) => {
    const statusColors = {
        pending: 'orange',      // Color para "Pendiente"
        completed: 'green',     // Color para "Completada"
        cancelled: 'red',       // Color para "Cancelada"
    };
    
    return statusColors[status] || 'gray'; // Color por defecto en caso de que el estado no coincida
};

export const tableConfig = [
    {
        Header: 'N°',
        accessor: 'numberID',
        sortable: true,
        align: 'left',
        maxWidth: '0.4fr',
        minWidth: '120px',
    },
    {
        Header: 'Cliente',
        accessor: 'client',
        sortable: true,
        align: 'left',
        maxWidth: '1.6fr',
        minWidth: '170px',
    },
    {
        Header: 'Fecha',
        accessor: 'date',
        sortable: true,
        align: 'left',
        cell: ({ value }) => {
            const time = value * 1000
            return (getTimeElapsed(time, 0))
        },
        maxWidth: '1fr',
        minWidth: '160px',
    },
    {
        Header: 'ITBIS',
        accessor: 'itbis',
        align: 'right',
        cell: ({ value }) => useFormatPrice(value),
        maxWidth: '1fr',
        minWidth: '100px',
    },
    {
        Header: 'Articulos',
        accessor: 'products',
        align: 'right',
        description: 'Artículos en la preventa',
        maxWidth: '1fr',
        minWidth: '100px',
    },
    {
        Header: 'Total',
        accessor: 'total',
        align: 'right',
        cell: ({ value }) => useFormatPrice(value),
        description: 'Monto total de la preventa',
        maxWidth: '1fr',
        minWidth: '110px',
    },
    {
        Header: 'Estatus',
        accessor: 'status',
        align: 'right',
        description: 'Estatus de la preventa',
        maxWidth: '1fr',
        minWidth: '100px',
        cell: ({ value }) => {
            const statusLabel = value === 'pending' ? 'Pendiente' : value === 'completed' ? 'Completada' : 'Cancelada';
            return <Tag color={getColorByStatus(value)}>{statusLabel}</Tag>;
        }
    },
    {
        Header: 'Acción',
        align: 'right',
        accessor: 'accion',
        description: 'Acciones disponibles',
        maxWidth: '1fr',
        minWidth: '80px',
        clickable: false,
        cell: ({ value }) => <EditButton value={value} />
    }
]
