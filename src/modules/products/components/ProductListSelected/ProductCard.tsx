import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useMemo, useState } from 'react';
import styled from 'styled-components';

import { formatPrice } from '@/utils/format';
import { Button } from '@/components/ui/Button/Button';

import type { ChangeEventHandler } from 'react';

interface SelectedProductItem {
  id: string;
  productName?: string;
  newStock: number;
  initialCost: number;
  [key: string]: unknown;
}

interface ProductCardProps {
  item: SelectedProductItem;
  handleDeleteProduct: (item: SelectedProductItem) => void;
  handleUpdateProduct: (payload: {
    value: Partial<SelectedProductItem>;
    productID: string;
  }) => void;
}

export const ProductCard = ({
  item,
  handleDeleteProduct,
  handleUpdateProduct,
}: ProductCardProps) => {
  return (
    <Container>
      <Col>
        <span>{item.productName}</span>
      </Col>
      <Col>
        <span>
          <Input
            value={item.newStock}
            onChange={(e) =>
              handleUpdateProduct({
                value: { newStock: Number(e.target.value) },
                productID: item.id,
              })
            }
          />
        </span>
      </Col>
      <Col>
        <span>
          <Input
            value={item.initialCost}
            handleBlur={(value) => formatPrice(value)}
            onChange={(e) =>
              handleUpdateProduct({
                value: { initialCost: Number(e.target.value) },
                productID: item.id,
              })
            }
          />
        </span>
      </Col>
      <Col>
        <span>{formatPrice(item.initialCost * item.newStock)}</span>
      </Col>
      <Button
        title={<FontAwesomeIcon icon={faTrash} />}
        width="icon24"
        border="light"
        borderRadius="normal"
        onClick={() => handleDeleteProduct(item)}
      />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-columns: 250px 1fr 1fr 1fr min-content;
  gap: 1em;
  align-content: center;
  align-items: center;
  height: 2.75em;
  padding: 0 0.8em;
  color: #353535;
  background-color: #fff;
  border-bottom: var(--border-primary);
  border-radius: var(--border-radius-light);

  &:last-child {
    border-bottom: none;
  }
`;
const Col = styled.div`
  color: var(--gray-6);

  &:first-child {
    span {
      display: -webkit-box;
      width: 100%;
      max-width: 180px;
      overflow: hidden;
      text-overflow: ellipsis;
      -webkit-line-clamp: 1;
      line-height: 1pc;
      text-transform: capitalize;

      /* white-space: nowrap; */
      -webkit-box-orient: vertical;
    }
  }

  &:nth-child(3n) {
    span {
      display: block;
      text-align: right;
    }
  }

  &:nth-child(4n) {
    display: block;
    text-align: right;

    span {
      display: block;
      text-align: right;
    }
  }
`;
interface InputProps {
  value: string | number;
  onChange: ChangeEventHandler<HTMLInputElement>;
  handleBlur?: (value: string | number) => string | number;
  handleFocus?: (value: string | number) => string | number;
}

const Input = ({
  value,
  onChange,
  handleBlur,
  handleFocus,
}: InputProps) => {
  const [isFocus, setIsFocus] = useState(false);

  const displayedValue = useMemo(() => {
    if (!isFocus && handleBlur) return handleBlur(value);
    if (isFocus && handleFocus) return handleFocus(value);
    return value;
  }, [isFocus, handleBlur, handleFocus, value]);

  return (
    <InputContainer
      value={displayedValue}
      onChange={onChange}
      onFocus={() => setIsFocus(true)}
      onBlur={() => setIsFocus(false)}
    />
  );
};
const InputContainer = styled.input`
  width: 100%;
  height: 100%;
  outline: none;
  border: none;
  border: 1px solid transparent;

  &:focus {
    border: 1px solid black;
  }
`;
