import { object, string, number, boolean } from 'yup';
const costSchema = object().shape({
    unit: number().nullable(false),
    total: number().nullable(false),
});

const priceSchema = object().shape({
    unit: number().nullable(false),
    total: number().nullable(false),
});

const taxSchema = object().shape({
    unit: number().nullable(false),
    total: number().nullable(false),
    ref: string().nullable(false),
    value: number().nullable(false),
});

const amountToBuySchema = object().shape({
    unit: number().required('el tipo de dato es requerido'),
    total: number().nullable(false),
});


export const productSchema = object().shape({
    productName: string().nullable(false),
    productImageURL: string(),
    category: string().nullable(false),
    cost: costSchema.nullable(false),
    price: priceSchema.nullable(false),
    size: string().nullable(false),
    type: string().nullable(false),
    tax: taxSchema.nullable(false),
    stock: number().nullable(false),
    netContent: string().nullable(false),
    order: number().nullable(false),
    amountToBuy: amountToBuySchema.required('el tipo de dato es requerido'),
    id: string().nullable(false),
    trackInventory: boolean().nullable(false),
});