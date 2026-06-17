import { nanoid } from 'nanoid';
import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import { addProduct } from '@/features/cart/cartSlice';
import {
  formatData,
  SelectIngredientsListName,
  selectTotalIngredientPrice,
} from '@/features/customProducts/customProductSlice';
import { handleModalSetCustomPizza } from '@/features/modals/modalSlice';
import { addNotification } from '@/features/notification/notificationSlice';
import { fbGetProductsQueryByType } from '@/firebase/products/customProduct/fbGetCustomProductByType';
import { separator } from '@/utils/number/number';
import { removeMatchesString } from '@/utils/text';
import { LegacyMotionModal } from '@/components/common/Modal';
import type { Product } from '@/features/cart/types';
import { getPizzaType } from '@/modules/sales/components/CustomProductModal/getPizzaType';

import { AddCustomProductModal } from './components/AddCustomProductModal/AddCustomProductModal';
import {
  buildCustomPizzaDraft,
  EMPTY_CUSTOM_PIZZA_DRAFT,
  type CustomProductDraft,
} from './components/buildCustomPizzaDraft';
import {
  getPrice,
  type PizzaProductSelected,
  type PizzaSliceMode,
} from './components/getPrice';
import { Header, type CustomProductItem } from './components/Header';
import { IngredientList } from './components/IngredientList';

interface HeaderState {
  products: CustomProductItem[];
  isComplete: PizzaSliceMode;
  productSelected: PizzaProductSelected;
  size: string;
}

type HeaderAction =
  | { type: 'reset' }
  | { type: 'setProducts'; payload: CustomProductItem[] }
  | { type: 'setSize'; payload: string }
  | { type: 'setIsComplete'; payload: PizzaSliceMode }
  | { type: 'setProductSelected'; payload: PizzaProductSelected };

const EMPTY_PRODUCT_SELECTED: PizzaProductSelected = { a: '', b: '' };
const PRODUCT_TYPE = 'pizza';
const INITIAL_HEADER_STATE: HeaderState = {
  products: [],
  isComplete: 'complete',
  productSelected: EMPTY_PRODUCT_SELECTED,
  size: '',
};

interface SetCustomProductProps {
  isOpen: boolean;
}

const headerReducer = (
  currentState: HeaderState,
  action: HeaderAction,
): HeaderState => {
  switch (action.type) {
    case 'reset':
      return INITIAL_HEADER_STATE;
    case 'setProducts':
      return { ...currentState, products: action.payload };
    case 'setSize':
      return {
        ...currentState,
        products: action.payload === '' ? [] : currentState.products,
        size: action.payload,
      };
    case 'setIsComplete':
      return { ...currentState, isComplete: action.payload };
    case 'setProductSelected':
      return { ...currentState, productSelected: action.payload };
    default:
      return currentState;
  }
};

const parseCustomProductItem = (value: string): CustomProductItem | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as CustomProductItem;
  } catch {
    return null;
  }
};

export const SetCustomProduct = ({ isOpen }: SetCustomProductProps) => {
  const dispatch = useDispatch();
  type HeaderRootState = Parameters<typeof selectUser>[0] &
    Parameters<typeof selectTotalIngredientPrice>[0];
  const user = useSelector((state: HeaderRootState) => selectUser(state));
  const totalIngredientPrice = useSelector((state: HeaderRootState) =>
    selectTotalIngredientPrice(state),
  );
  const ingredientListNameSelected = useSelector((state: HeaderRootState) =>
    SelectIngredientsListName(state),
  );
  const [IngredientModalOpen, setIngredientModalOpen] = useState(false);
  const handleIngredientOpen = () =>
    setIngredientModalOpen(!IngredientModalOpen);
  const [headerState, dispatchHeader] = useReducer(
    headerReducer,
    INITIAL_HEADER_STATE,
  );
  const [initialState, setInitialState] = useState(false);
  const { products, isComplete, productSelected, size } = headerState;

  const matchList = useMemo(
    () => /Completa|Pepperoni|Vegetales|Jamón y queso|Maíz |Pollo/g,
    [],
  );
  const selectedFirstProduct = useMemo(
    () => parseCustomProductItem(productSelected.a),
    [productSelected.a],
  );
  const selectedSecondProduct = useMemo(
    () => parseCustomProductItem(productSelected.b),
    [productSelected.b],
  );
  const calculatedPrice = useMemo(() => {
    const basePrice = getPrice({ productSelected, isComplete });
    return Number(basePrice || 0) + totalIngredientPrice;
  }, [isComplete, productSelected, totalIngredientPrice]);
  const productName = useMemo(() => {
    const extrasSuffix = ingredientListNameSelected
      ? `. Ingredientes extras: ${ingredientListNameSelected}`
      : '';

    if (isComplete === 'complete' && selectedFirstProduct?.name) {
      const firstProductName = removeMatchesString(
        String(selectedFirstProduct.name),
        matchList,
      );
      return `${getPizzaType(firstProductName)}${extrasSuffix}`;
    }

    if (
      isComplete === 'half' &&
      selectedFirstProduct?.name &&
      selectedSecondProduct?.name
    ) {
      const firstProductName = removeMatchesString(
        String(selectedFirstProduct.name),
        matchList,
      );
      const secondProductName = removeMatchesString(
        String(selectedSecondProduct.name),
        matchList,
      );
      return `pizza mitad de ${firstProductName} y mitad de ${secondProductName}${extrasSuffix}`;
    }

    return '';
  }, [
    ingredientListNameSelected,
    isComplete,
    matchList,
    selectedFirstProduct,
    selectedSecondProduct,
  ]);
  const newProduct = useMemo(
    () =>
      buildCustomPizzaDraft({
        currentDraft: EMPTY_CUSTOM_PIZZA_DRAFT,
        productName,
        calculatedPrice,
        size,
      }),
    [calculatedPrice, productName, size],
  );

  const resetHeaderState = useCallback(() => {
    dispatchHeader({ type: 'reset' });
    setInitialState(false);
  }, []);

  useEffect(() => {
    if (!initialState) return undefined;

    const resetTimeout = window.setTimeout(() => {
      resetHeaderState();
    }, 1000);

    return () => {
      window.clearTimeout(resetTimeout);
    };
  }, [initialState, resetHeaderState]);

  useEffect(() => {
    if (size === '') return;

    fbGetProductsQueryByType<CustomProductItem>(
      ((items: SetStateAction<CustomProductItem[]>) => {
        dispatchHeader({
          type: 'setProducts',
          payload: typeof items === 'function' ? items([]) : items,
        });
      }) as Dispatch<SetStateAction<CustomProductItem[]>>,
      PRODUCT_TYPE,
      size,
      user,
    );
  }, [size, user]);

  const buildCartProduct = (draft: CustomProductDraft): Product => ({
    id: draft.id,
    cid: draft.id,
    name: draft.name,
    amountToBuy: Number(draft.amountToBuy ?? 1),
    size: draft.size,
    price: draft.pricing.price,
    pricing: {
      listPrice: Number(draft.pricing.price ?? 0),
      price: Number(draft.pricing.price ?? 0),
      tax: draft.pricing.tax,
    },
    cost: { total: Number(draft.pricing.cost ?? 0) },
  });

  const closeModal = () => {
    dispatch(handleModalSetCustomPizza());
    dispatch(formatData());
    setInitialState(true);
  };

  const handleSubmit = async () => {
    if (newProduct?.name === '') {
      dispatch(
        addNotification({
          title: 'Error',
          message: 'Debe seleccionar un producto',
          type: 'error',
        }),
      );
      return;
    }

    const draftToAdd = buildCustomPizzaDraft({
      currentDraft: newProduct,
      productName,
      calculatedPrice,
      size,
      createId: () => nanoid(8),
    });

    dispatch(addProduct(buildCartProduct(draftToAdd)));
  };

  return (
    <LegacyMotionModal
      isOpen={isOpen}
      close={closeModal}
      btnSubmitName="Aceptar"
      nameRef="Producto Personalizable"
      handleSubmit={handleSubmit}
      subModal={
        <AddCustomProductModal
          isOpen={IngredientModalOpen}
          handleOpen={handleIngredientOpen}
        />
      }
    >
      <Body>
        <Header
          Row={Row}
          Group={Group}
          products={products}
          isComplete={isComplete}
          productSelected={productSelected}
          size={size}
          calculatedPrice={calculatedPrice}
          onSliceModeChange={(nextMode) =>
            dispatchHeader({ type: 'setIsComplete', payload: nextMode })
          }
          onSizeChange={(nextSize) =>
            dispatchHeader({ type: 'setSize', payload: nextSize })
          }
          onProductSelectedChange={(nextProductSelected) =>
            dispatchHeader({
              type: 'setProductSelected',
              payload: nextProductSelected,
            })
          }
        />
        <IngredientList handleIngredientOpen={handleIngredientOpen} />
        <PriceBar>
          <span></span>
          <span>Total: RD$ {separator(newProduct?.pricing?.price)}</span>
        </PriceBar>
      </Body>
    </LegacyMotionModal>
  );
};

const Body = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  gap: 0.2em 0.4em;
  width: 100%;
  height: 100%;
  padding: 1em;
  background-color: #f1ebeb;
`;
const Row = styled.div`
  display: flex;
  gap: 1em;
  margin-bottom: 0.4em;
`;
const Group = styled.div`
  flex: 1 1 0;

  div {
    select {
      width: 100%;
    }
  }
`;

const PriceBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.4em;
  padding: 0 1em;
`;
