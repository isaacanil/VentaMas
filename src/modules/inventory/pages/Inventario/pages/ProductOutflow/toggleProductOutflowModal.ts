import { OPERATION_MODES } from '@/constants/modes';
import { toggleAddProductOutflow } from '@/features/modals/modalSlice';
import { setProductOutflowData } from '@/features/productOutflow/productOutflow';
import type { Dispatch } from 'redux';

type ProductOutflowItem = {
  id?: string | null;
  product?: string | null;
  motive?: string;
  quantityRemoved?: number;
  observations?: string;
  status?: boolean;
};

type ProductOutflowData = {
  id?: string | null;
  productList?: ProductOutflowItem[];
  date?: unknown;
};

const EmptyProductsOutflow: ProductOutflowItem[] = [];

const EmptyProduct: ProductOutflowItem = {
  id: null, // Identificador único del producto
  product: null, // Identificador del producto específico que se vende
  motive: '', //Identificador de la razón detrás de la salida del producto
  quantityRemoved: 0, // La cantidad del producto que se vende.
  observations: '', // Cualquier comentario adicional o notas relacionadas con el producto
  status: false, // El estado de la salida del producto (si se ha completado o no)
};
export class OutflowData {
  mode: string;
  productSelected: ProductOutflowItem;
  data: ProductOutflowData;

  constructor({
    mode,
    productSelected,
    data,
  }: {
    mode?: string;
    productSelected?: ProductOutflowItem | null;
    data?: ProductOutflowData | null;
  }) {
    this.mode = mode || OPERATION_MODES.CREATE.id;
    this.productSelected = productSelected || EmptyProduct;
    this.data = {
      id: data && data?.id != null ? data.id : null,
      productList:
        data && data?.productList ? data.productList : EmptyProductsOutflow,
      date: data && data.date ? data.date : null,
    };
  }
}

export class ProductOutflowDataFormatter {
  id?: string | null;
  productList?: ProductOutflowItem[];
  date?: unknown;

  constructor(items: ProductOutflowData) {
    const { id, productList, date } = items;
    this.id = id;
    this.productList = productList;
    this.date = date;
  }
}

type ToggleProductOutflowModalParams = {
  data?: ProductOutflowData | null;
  mode?: string;
  dispatch: Dispatch;
};

export const toggleProductOutflowModal = ({
  data,
  mode,
  dispatch,
}: ToggleProductOutflowModalParams) => {
  //abrir el modal de productOutflow
  dispatch(toggleAddProductOutflow());
  //enviar los datos al modal

  const newData = new OutflowData({
    mode,
    productSelected: EmptyProduct,
    data,
  });
  dispatch(setProductOutflowData({ data: newData }));
};
