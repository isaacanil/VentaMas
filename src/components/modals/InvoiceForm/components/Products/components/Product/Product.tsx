import { Button, Input } from 'antd';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { changeAmountToBuyProduct } from '@/features/invoice/invoiceFormSlice';
import type { InvoiceProduct } from '@/types/invoice';
import { resolveInvoiceAmount } from '@/utils/invoice/amount';
import { toNumber } from '@/utils/number/toNumber';

interface ProductProps {
  product: InvoiceProduct;
}

const getQuantityValue = (product: InvoiceProduct) =>
  resolveInvoiceAmount(product?.amountToBuy);

const getUnitPrice = (product: InvoiceProduct) => {
  if (typeof product.price === 'number') return toNumber(product.price);
  return toNumber(product.price?.unit ?? product.pricing?.price);
};

export const Product = ({ product }: ProductProps) => {
  const dispatch = useDispatch();
  const increase = () => {
    dispatch(changeAmountToBuyProduct({ product, type: 'add' }));
  };
  const decrease = () => {
    dispatch(changeAmountToBuyProduct({ product, type: 'subtract' }));
  };
  const onChange = (value: string) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return;
    dispatch(
      changeAmountToBuyProduct({
        product,
        amount: numericValue,
        type: 'change',
      }),
    );
  };
  const quantity = getQuantityValue(product);
  const unitPrice = getUnitPrice(product);
  const totalPrice =
    typeof product.price === 'number'
      ? toNumber(product.price)
      : toNumber(product.price?.total ?? unitPrice * quantity);
  return (
    <Container>
      <Header>{product?.productName}</Header>
      <Body>
        <div>
          {quantity} x {unitPrice} = {totalPrice}
        </div>
        <Counter>
          <Button onClick={decrease} icon={icons.mathOperations.subtract} />
          <Input
            value={getQuantityValue(product)}
            onChange={(value) => onChange(value.target.value)}
          />
          <Button icon={icons.operationModes.add} onClick={increase} />
        </Counter>
      </Body>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-columns: minmax(100px, 200px) min-content;
  gap: 1em;
`;
const Header = styled.div`
  /* Header container */
`;
const Body = styled.div`
  /* Body container */
`;
const Counter = styled.div`
  display: grid;
  grid-template-columns: 2em 80px 2em;
  gap: 1em;
`;
