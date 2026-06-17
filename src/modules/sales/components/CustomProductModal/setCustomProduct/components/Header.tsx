import { useMemo, type ComponentType, type ReactNode } from 'react';
import styled from 'styled-components';

import { separator } from '@/utils/number/number';
import customPizzaData from '@/modules/sales/components/CustomProductModal/setCustomProduct/customPizza.json';

import type { PizzaProductSelected, PizzaSliceMode } from './getPrice';

export interface CustomProductItem {
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

type LayoutComponent = ComponentType<{ children?: ReactNode }>;

interface HeaderProps {
  Row: LayoutComponent;
  Group: LayoutComponent;
  products: CustomProductItem[];
  isComplete: PizzaSliceMode;
  productSelected: PizzaProductSelected;
  size: string;
  calculatedPrice: number;
  onSliceModeChange: (mode: PizzaSliceMode) => void;
  onSizeChange: (size: string) => void;
  onProductSelectedChange: (productSelected: PizzaProductSelected) => void;
}

export const Header = ({
  Row,
  Group,
  products,
  isComplete,
  productSelected,
  size,
  calculatedPrice,
  onSliceModeChange,
  onSizeChange,
  onProductSelectedChange,
}: HeaderProps) => {
  const { pizzaSlices, sizeList } = customPizzaData as CustomPizzaConfig;
  const sortedProducts = useMemo(
    () =>
      [...products].sort((a, b) => {
        const firstName = String(a?.name ?? '');
        const secondName = String(b?.name ?? '');
        return firstName.localeCompare(secondName);
      }),
    [products],
  );

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
                onSliceModeChange(e.target.value as PizzaSliceMode)
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
              onChange={(e) => onSizeChange(e.target.value)}
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
                onProductSelectedChange({
                  ...productSelected,
                  a: e.target.value,
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
                  onProductSelectedChange({
                    ...productSelected,
                    b: e.target.value,
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
