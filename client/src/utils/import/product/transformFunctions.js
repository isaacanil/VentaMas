import { transform } from "framer-motion";
import { warrantyOptions } from "../../../views/component/modals/ProductForm/components/sections/WarrantyInfo";
import { initTaxes } from "../../../views/component/modals/UpdateProduct/InitializeData";


export const transformConfig = [
    {
        field: 'name',
        transform: (value) => value || ''
    },
    {
        field: 'image',
        transform: (value) => value || ''
    },
    {
        field: 'category',
        transform: (value) => value || ''
    },
    {
        field: 'pricing.cost', // Nuevo
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'pricing.price',
        source: 'pricing.listPrice',
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'pricing.listPrice', // Nuevo
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'pricing.avgPrice', // Nuevo
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'pricing.minPrice', // Nuevo
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'pricing.tax', // Nuevo
        transform: (value) => String(value) || initTaxes[0] // Usa el valor por defecto de initTaxes
    },
    {
        field: 'promotions.start',
        transform: (value) => value || null
    },
    {
        field: 'promotions.end',
        transform: (value) => value || null
    },
    {
        field: 'promotions.discount',
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'promotions.isActive',
        transform: (value) => ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || false
    },
    {
        field: 'weightDetail.isSoldByWeight',
        transform: (value) => ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || false
    },
    {
        field: 'weightDetail.weight',
        transform: (value) => parseFloat(value) || 0
    },
    {
        field: 'weightDetail.weightUnit',
        transform: (value) => value || 'lb'
    },
    {
        field: 'warranty.status',
        transform: (value) => ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || false
    },
    {
        field: 'warranty.quantity',
        transform: (value) => parseInt(value) || 1
    },
    {
        field: 'warranty.unit',
        transform: (value) => value || warrantyOptions[1].value
    },
    {
        field: 'size',
        transform: (value) => value || ''
    },
    {
        field: 'type',
        transform: (value) => value || ''
    },
    {
        field: 'stock', // Nuevo
        transform: (value) => parseInt(value) || 0
    },
    {
        field: 'netContent',
        transform: (value) => value || ''
    },
    {
        field: 'amountToBuy',
        transform: (value) => parseFloat(value) || 1
    },
    {
        field: 'createdBy',  // Puedes decidir si necesitas transformar esto
        transform: (value) => value || 'unknown'
    },
    {
        field: 'id', // Probablemente no necesites transformar el ID
        transform: (value) => value || ''
    },
    {
        field: 'order',
        transform: (value) => parseInt(value) || 1
    },
    {
        field: 'isVisible',
        transform: (value) => ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || true // Valor por defecto: true
    },
    {
        field: 'footer',
        transform: (value) => value || ''
    },
    {
        field: 'measurement',
        transform: (value) => value || ''
    },
    {
        field: 'trackInventory',
        transform: (value) => ['sí', 'yes'].includes(value?.toString()?.toLowerCase()) || true // Valor por defecto: true
    },
    {
        field: 'qrcode',
        transform: (value) => value || ''
    },
    {
        field: 'barcode',
        transform: (value) => value || ''
    }

    // ... other fields that can be null or have specific default values
];

