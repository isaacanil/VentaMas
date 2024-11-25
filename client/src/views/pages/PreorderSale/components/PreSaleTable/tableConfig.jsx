import { getTimeElapsed } from "../../../../../hooks/useFormatTime";
import { Tag } from "../../../../templates/system/Tag/Tag";
import { useFormatPrice } from '../../../../../hooks/useFormatPrice'
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";
import { selectUser } from "../../../../../features/auth/userSlice";
import * as antd from "antd";
import { icons } from "../../../../../constants/icons/icons";
import { setCart, setCartId, toggleInvoicePanelOpen } from "../../../../../features/cart/cartSlice";
import { validateInvoiceCart } from "../../../../../utils/invoiceValidation";
import { ConfirmModal } from "../../../../component/modals/ConfirmModal/ConfirmModal";
import { fbCancelPreorder } from "../../../../../firebase/invoices/fbCancelPreorder";
import PreorderModal from "../../../../component/modals/PreorderModal/PreorderModal";

const EditButton = ({ value }) => {
    const dispatch = useDispatch()
    const data = value.data;
    const user = useSelector(selectUser)
    const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false)

    const handleCancelPreorder = async () => {
        try {
            await fbCancelPreorder(user, data)
            setIsCancelConfirmOpen(false)
        } catch (err) {
            console.log(err)
        }
    }
    const handleInvoicePanelOpen = () => {
        const { isValid, message } = validateInvoiceCart(data)
        if (isValid) {
            dispatch(toggleInvoicePanelOpen())
            dispatch(setCart(data))
            dispatch(setCartId())
        } else {
            antd.notification.error({
                description: message
            })
        }
    }

    return (
        <div style={{
            display: 'flex',
            gap: '10px',
        }}>
         
                <PreorderModal/>
            <antd.Button
                icon={icons.editingActions.complete}
                onClick={handleInvoicePanelOpen}
            />
            <antd.Button
                icon={icons.editingActions.cancel}
                onClick={() => setIsCancelConfirmOpen(true)}
                danger
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
    )
}
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
        cell: ({ value }) => <EditButton value={value} />
    }
]
