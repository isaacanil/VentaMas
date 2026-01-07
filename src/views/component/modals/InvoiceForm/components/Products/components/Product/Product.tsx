// @ts-nocheck
import { Button, Input } from 'antd';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { changeAmountToBuyProduct } from '@/features/invoice/invoiceFormSlice';

export const Product = ({ product }) => {
  const dispatch = useDispatch();
  const increase = () => {
    dispatch(changeAmountToBuyProduct({ product, type: 'add' }));
  };
  const decrease = () => {
    dispatch(changeAmountToBuyProduct({ product, type: 'subtract' }));
  };
  function isValidNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }
  const onChange = (value) => {
    value = Number(value);
    if (!isValidNumber(value)) return;
    dispatch(
      changeAmountToBuyProduct({ product, amount: value, type: 'change' }),
    );
  };
  return (
    <Container>
      <Header>{product?.productName}</Header>
      <Body>
        <div>
          {product?.amountToBuy?.total} x {product?.price?.unit} ={' '}
          {product?.price?.total}
        </div>
        <Counter>
          <Button onClick={decrease} icon={icons.mathOperations.subtract} />
          <Input
            value={product.amountToBuy.total}
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
