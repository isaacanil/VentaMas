import {
    ShoppingCartOutlined,
    EditOutlined,
    DeleteOutlined,
} from '@ant-design/icons';
import { useNavigate } from "react-router-dom";

import { ActionIcon } from '../../../../../../config/statusActionConfig';
import { getOrderConditionByID, getOrderStateByID } from "../../../../../../constants/orderAndPurchaseState";
import { replacePathParams } from "../../../../../../routes/replacePathParams";
import { ROUTES } from "../../../../../../routes/routesName";
import TextCell from "../../../../../templates/system/AdvancedTable/components/Cells/Text/TextCerll";

function ProviderCell({ value }) {
    if (!value) return null; // Añadir esta línea para manejar valores undefined

    return (
        <TextCell value={value}></TextCell>
    );
}

function ActionButtons({ purchaseData }) {
    const navigate = useNavigate();

    const { PURCHASES_UPDATE, PURCHASES_COMPLETE } = ROUTES.PURCHASE_TERM;

    const handleCompletePurchase = () => {
        const path = replacePathParams(PURCHASES_COMPLETE, purchaseData.id);
        navigate(path);
    };

    const handleUpdatePurchase = () => {
        const path = replacePathParams(PURCHASES_UPDATE, purchaseData.id);
        navigate(path);
    };

    if (purchaseData.status === 'completed' ) {
        return null;
    }
    if (purchaseData.status === 'pending') {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                borderRadius: '8px',
            }}>
                <ActionIcon
                    icon={<ShoppingCartOutlined />}
                    tooltip="Completar compra"
                    color="#555"
                    hoverColor="#52c41a"
                    onClick={handleCompletePurchase}
                />
                <ActionIcon
                    icon={<EditOutlined />}
                    tooltip="Editar"
                    color="#555"
                    hoverColor="#faad14"
                    onClick={handleUpdatePurchase}
                />
                <ActionIcon
                    icon={<DeleteOutlined />}
                    tooltip="Cancelar compra"
                    color="#555"
                    hoverColor="#ff4d4f"
                    onClick={purchaseData.onCancel}
                />
            </div>
        );
    }
}

export const columns = [
    {
        Header: '#',
        accessor: 'number',
        type: 'number',
        maxWidth: '50px',
        minWidth: '50px',
        keepWidth: true,
        fixed: 'left',
    },
    {
        Header: 'Estado',
        accessor: 'status',
        type: 'status',
        maxWidth: '150px',
        minWidth: '150px',
    },
    {
        Header: 'Proveedor',
        accessor: 'provider',
        minWidth: '150px',
        cell: ({ value }) => <ProviderCell value={value} />
    },
    {
        Header: 'Fecha Delivery',
        accessor: 'deliveryAt',
        maxWidth: '140px',
        minWidth: '140px',
        type: 'dateStatus',
    },
    {
        Header: 'Fecha Pago',
        accessor: 'paymentAt',
        minWidth: '140px',
        maxWidth: '140px',
        type: 'dateStatus',
    },
    {
        Header: 'Evidencia',
        accessor: 'fileList',
        maxWidth: '90px',
        minWidth: '90px',
        align: 'right',
        type: 'file',
    },
    {
        Header: 'Nota',
        accessor: 'note',
        maxWidth: '70px',
        minWidth: '70px',
        keepWidth: true,
        type: 'note',
    },
    {
        Header: 'Items',
        accessor: 'items',
        align: 'right',
        minWidth: '80px',
        maxWidth: '80px',
        type: 'badge',
    },
    {
        Header: 'Total',
        accessor: 'total',
        align: 'right',
        minWidth: '150px',
        maxWidth: '150px',
        format: 'price',
        type: 'badge',
    },

    {
        Header: 'Acción',
        accessor: 'action',
        maxWidth: '120px',
        minWidth: '120px',
        keepWidth: true,
        align: 'right',
        fixed: 'right',
        cell: ({ value }) => <ActionButtons purchaseData={value} />
    }
]

export const filterConfig = [
    {
        label: 'Proveedor',
        accessor: 'provider',
    },
    {
        label: 'Estado',
        accessor: 'state',
        format: (value) => `${getOrderStateByID(value)?.name}`,
    },
    {
        label: 'Condición',
        accessor: 'condition',
        format: (value) => `${getOrderConditionByID(value)}`
    }
];