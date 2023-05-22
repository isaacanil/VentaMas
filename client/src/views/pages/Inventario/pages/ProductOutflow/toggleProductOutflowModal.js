import React from 'react'
import { OPERATION_MODES } from '../../../../../constants/modes';
const EmptyProductsOutflow = []

const EmptyProduct = {
    id: null, // Identificador único del producto
    product: null, // Identificador del producto específico que se vende
    motive: '', //Identificador de la razón detrás de la salida del producto
    quantity: 0, // La cantidad del producto que se vende.
    observations: "", // Cualquier comentario adicional o notas relacionadas con el producto
    status: false // El estado de la salida del producto (si se ha completado o no)
}
const EmptyProductOutflow = {
    id: null, // Identificador único de la salida del producto
    productList: EmptyProductsOutflow, // Lista de productos que se venden
    date: null, // Fecha de la salida del producto
}

export class OutflowData {
    constructor({ mode, productSelected, data }) {
        this.mode = mode || OPERATION_MODES.CREATE.id;
        this.productSelected = productSelected || EmptyProduct;
        this.data = {
            id: (data && data?.id != null) ? data.id : null,
            productList: (data && data?.productList) ? data.productList : EmptyProductsOutflow,
            date: (data && data.date) ? data.date : null,
        }
    }
}

export class ProductOutflowDataFormatter {
    constructor(items) {
        const { id, productList, date } = items;
        this.id = id;
        this.productList = productList;
        this.date = date;
    }
}


import { toggleAddProductOutflow } from '../../../../../features/modals/modalSlice';
import { setProductOutflowData } from '../../../../../features/productOutflow/productOutflow';

export const toggleProductOutflowModal = ({ data, mode, dispatch }) => {
    //abrir el modal de productOutflow
    dispatch(toggleAddProductOutflow())
    //enviar los datos al modal

    const newData = new OutflowData({ mode, EmptyProduct, data})
    dispatch(setProductOutflowData({ data: newData }))
}

