import { nanoid } from 'nanoid';
import React, { useCallback, useEffect, useMemo, useReducer } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectUser } from '@/features/auth/userSlice';
import {
  SelectIngredientsListName,
  selectTotalIngredientPrice,
} from '@/features/customProducts/customProductSlice';
import { fbGetProductsQueryByType } from '@/firebase/products/customProduct/fbGetCustomProductByType';
import { separator } from '@/utils/number/number';
import { removeMatchesString } from '@/utils/text';
import { getPizzaType } from '@/components/modals/CustomProduct/getPizzaType';
import customPizzaData from '@/components/modals/CustomProduct/setCustomProduct/customPizza.json';

import {
  getPrice,
  type PizzaProductSelected,
  type PizzaSliceMode,
} from './getPrice';

interface CustomProductDraft {
  name: string;
  id: string;
  amountToBuy: number;
  pricing: {
    price: number;
    cost: number;
    tax: number;
  };
  size: string;
}

interface CustomProductItem {
  name?: string;
  pricing?: {
    price?: number;
    cost?: number;
    tax?: number;
  };
  [key: string]: unknown;
}

interface PizzaSliceOption {
  value: PizzaSliceMode;
  label: string;
}

interface PizzaSizeOption {
  value: string;
  label: string;
}

interface CustomPizzaConfig {
  pizzaSlices: PizzaSliceOption[];
  sizeList: PizzaSizeOption[];
}

interface HeaderState {
  products: CustomProductItem[];
  isComplete: PizzaSliceMode;
  productSelected: PizzaProductSelected;
  size: string;
}

const EmptyNewProduct: CustomProductDraft = {
  name: '',
  id: '',
  amountToBuy: 1,
  pricing: {
    price: 0,
    cost: 0,
    tax: 0,
  },
  size: '',
};
const EmptyProductSelected: PizzaProductSelected = { a: '', b: '' };
const productType = 'pizza';
const INITIAL_HEADER_STATE: HeaderState = {
  products: [],
  isComplete: 'complete',
  productSelected: EmptyProductSelected,
  size: '',
};

const parseCustomProductItem = (value: string): CustomProductItem | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as CustomProductItem;
  } catch {
    return null;
  }
};

type LayoutComponent = React.ComponentType<{ children?: React.ReactNode }>;

interface HeaderProps {
  Row: LayoutComponent;
  Group: LayoutComponent;
  setNewProduct: React.Dispatch<React.SetStateAction<CustomProductDraft>>;
  initialState: boolean;
  setInitialState: React.Dispatch<React.SetStateAction<boolean>>;
}

export const Header = ({
  Row,
  Group,
  setNewProduct,
  initialState,
  setInitialState,
}: HeaderProps) => {
  type HeaderRootState = Parameters<typeof selectUser>[0] &
    Parameters<typeof selectTotalIngredientPrice>[0];
  const user = useSelector((state: HeaderRootState) => selectUser(state));

  const [state, dispatch] = useReducer(
    (
      currentState: HeaderState,
      action:
        | { type: 'reset' }
        | { type: 'setProducts'; payload: CustomProductItem[] }
        | { type: 'setSize'; payload: string }
        | { type: 'setIsComplete'; payload: PizzaSliceMode }
        | { type: 'setProductSelected'; payload: PizzaProductSelected },
    ): HeaderState => {
      switch (action.type) {
        case 'reset':
          return INITIAL_HEADER_STATE;
        case 'setProducts':
          return { ...currentState, products: action.payload };
        case 'setSize':
          return { ...currentState, size: action.payload };
        case 'setIsComplete':
          return { ...currentState, isComplete: action.payload };
        case 'setProductSelected':
          return { ...currentState, productSelected: action.payload };
        default:
          return currentState;
      }
    },
    INITIAL_HEADER_STATE,
  );
  const { pizzaSlices, sizeList } = customPizzaData as CustomPizzaConfig;
  const { products, isComplete, productSelected, size } = state;

  const matchList = useMemo(
    () => /Completa|Pepperoni|Vegetales|Jamón y queso|Maíz |Pollo/g,
    [],
  );

  const totalIngredientPrice = useSelector((state: HeaderRootState) =>
    selectTotalIngredientPrice(state),
  );
  const IngredientListNameSelected = useSelector((state: HeaderRootState) =>
    SelectIngredientsListName(state),
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
    const extrasSuffix = IngredientListNameSelected
      ? `. Ingredientes extras: ${IngredientListNameSelected}`
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
    IngredientListNameSelected,
    isComplete,
    matchList,
    selectedFirstProduct,
    selectedSecondProduct,
  ]);
  const sortedProducts = [...products].sort((a, b) => {
    const firstName = String(a?.name ?? '');
    const secondName = String(b?.name ?? '');
    return firstName.localeCompare(secondName);
  });
  const resetHeaderState = useCallback(() => {
    dispatch({ type: 'reset' });
    setNewProduct(EmptyNewProduct);
    setInitialState(false);
  }, [setInitialState, setNewProduct]);

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
    if (size !== '') {
      fbGetProductsQueryByType(
        (items) => dispatch({ type: 'setProducts', payload: items }),
        productType,
        size,
        user,
      );
      return;
    }
    dispatch({ type: 'setProducts', payload: [] });
  }, [size, user]);

  useEffect(() => {
    setNewProduct((currentProduct) => ({
      ...currentProduct,
      name: productName,
      pricing: {
        ...currentProduct.pricing,
        price: productName ? calculatedPrice : 0,
      },
      size,
      id: productName ? currentProduct.id || nanoid(8) : '',
    }));
  }, [calculatedPrice, productName, setNewProduct, size]);

  return (
    <Container>
      <Row>
        <Group>
          <h4>Porción</h4>
          <div>
            <Select
              name=""
              id=""
              value={isComplete}
              onChange={(e) =>
                dispatch({
                  type: 'setIsComplete',
                  payload: e.target.value as PizzaSliceMode,
                })
              }
            >
              {pizzaSlices.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </Select>
          </div>
        </Group>
        <Group>
          <h4>Tamaño</h4>
          <div>
            <Select
              name=""
              id=""
              value={size}
              onChange={(e) =>
                dispatch({ type: 'setSize', payload: e.target.value })
              }
            >
              {sizeList.map((sizeOption) => (
                <option value={sizeOption.value} key={sizeOption.value}>
                  {sizeOption.label}
                </option>
              ))}
            </Select>
          </div>
        </Group>
      </Row>
      <Row>
        <Group>
          <div>
            <Select
              name=""
              id=""
              value={productSelected.a}
              onChange={(e) =>
                dispatch({
                  type: 'setProductSelected',
                  payload: { ...productSelected, a: e.target.value },
                })
              }
            >
              <option value="">Eligir</option>
              {sortedProducts.map((product) => (
                <option
                  value={JSON.stringify(product)}
                  key={JSON.stringify(product)}
                >
                  {product?.name}
                </option>
              ))}
            </Select>
          </div>
        </Group>
        {isComplete === 'half' ? (
          <Group>
            <div>
              <Select
                name=""
                id=""
                value={productSelected.b}
                onChange={(e) =>
                  dispatch({
                    type: 'setProductSelected',
                    payload: { ...productSelected, b: e.target.value },
                  })
                }
              >
                <option value="">Eligir</option>
                {sortedProducts.map((product) => (
                  <option
                    value={JSON.stringify(product)}
                    key={JSON.stringify(product)}
                  >
                    {product?.name}
                  </option>
                ))}
              </Select>
            </div>
          </Group>
        ) : null}
      </Row>
      <ProductPriceBar>
        <span>Total: RD$ {separator(calculatedPrice)}</span>
      </ProductPriceBar>
    </Container>
  );
};
const Container = styled.div``;

const Select = styled.select`
  width: 100%;
  height: 1.8em;
  padding: 0 0.6em;
  border-radius: var(--border-radius-light);
  transition: width 0.5s ease;
`;
const ProductPriceBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 2em;
  padding: 0 1em;

  /* background-color: #f1ebeb; */
`;
