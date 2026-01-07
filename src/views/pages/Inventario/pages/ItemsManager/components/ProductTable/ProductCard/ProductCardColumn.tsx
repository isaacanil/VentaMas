// @ts-nocheck
import { faTrash, faPencil } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styled from 'styled-components';

import noImg from '@/assets/producto/noimg.png';
import { formatPrice } from '@/utils/format';
import { Button } from '@/views/templates/system/Button/Button';

export const ProductCardColumn = ({
  handleDeleteProduct,
  handleUpdateProduct,
  product,
}) => {
  return (
    <Container>
      <Head>
        {' '}
        <Button
          title="Editar"
          startIcon={<FontAwesomeIcon icon={faPencil} />}
          borderRadius="normal"
          // variant='contained'
          color={'gray-dark'}
          bgcolor="editar"
          onClick={() => handleUpdateProduct(product)}
        />{' '}
        <Button
          startIcon={<FontAwesomeIcon icon={faTrash} />}
          // width='icon32'
          color={'gray-dark'}
          borderRadius="normal"
          // bgcolor='error'
          onClick={() => handleDeleteProduct(product.id)}
        />
      </Head>
      <Img>
        <img
          src={product.productImageURL}
          alt=""
          onError={({ currentTarget }) => {
            currentTarget.onerror = null;
            currentTarget.src = noImg;
            currentTarget.style.objectFit = 'contain';
          }}
        />
      </Img>
      <Body>
        <ProductName>
          <h3>{product.productName}</h3>
        </ProductName>

        <Item>
          <span>costo: {formatPrice(product.cost.unit)}</span>
        </Item>
        <Item>
          <span>stock: {product.stock}</span>
        </Item>

        <Item>
          <span>Total: {formatPrice(product.price.unit)}</span>
        </Item>
      </Body>
    </Container>
  );
};

const Container = styled.div`
  display: grid;
  grid-auto-rows: min-content;
  gap: 0.6em;
  padding: 0.5em;
  padding-top: 0.3em;
  background-color: white;
  border: 1px solid rgb(0 0 0 / 6.8%);
  border-radius: var(--border-radius1);
`;
const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: min-content;
`;
const Img = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 120px;
  max-height: 120px;
  margin-top: -5px;
  overflow: hidden;
  border-radius: 8px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;
const Body = styled.div`
  /* Body container */
`;
const ProductName = styled.div`
  color: #1d1d1f;

  h3 {
    margin: 0;
    font-size: 0.9em;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
`;
const Item = styled.div`
  /* Item container */
`;
