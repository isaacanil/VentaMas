import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import {
  addProductToProductOutflow,
  selectProduct,
  SelectProductSelected,
  type ProductSelected,
} from '@/features/productOutflow/productOutflow';
import { ProductFilter } from '@/modules/inventory/components/ProductFilter/ProductFilter';
import { Button } from '@/components/ui/Button/Button';
import { InputV4 } from '@/components/ui/Inputs/GeneralInput/InputV4';
import {
  useTableHeaderColumns,
  type TableHeaderColumn,
} from './tableConfig/tableHeaderConfig';
import type { ProductRecord } from '@/types/products';

type ProductSummary = ProductRecord;

type ProductOutflowSelected = ProductSelected & {
  product?: ProductSummary | null;
  currentRemovedQuantity?: number;
};

type RowProps = {
  $columns?: TableHeaderColumn[];
};

export const OutputProductEntry = () => {
  const dispatch = useDispatch();
  const [showProductList, setShowProductList] = useState(false);
  const productSelected = useSelector(
    SelectProductSelected,
  ) as ProductOutflowSelected;

  const handleAddToProductOutflow = () =>
    dispatch(addProductToProductOutflow(productSelected));

  const handleSelectProduct = async (product: ProductSummary) => {
    dispatch(selectProduct({ ...productSelected, product }));
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    type?: 'number',
  ) => {
    const { name, value } = e.target;
    const nextValue = type === 'number' ? Number(value) : value;
    return dispatch(
      selectProduct({
        ...productSelected,
        [name]: nextValue,
      }),
    );
  };

  const tableColumns = useTableHeaderColumns({ Group });

  return (
    <Container>
      <Row $columns={tableColumns}>
        {tableColumns.map((col, index) => (
          <Col key={index}>{col.render(col.subtitle)}</Col>
        ))}
      </Row>
      <Row $columns={tableColumns}>
        <ProductFilter
          handleSelectProduct={handleSelectProduct}
          isOpen={showProductList}
          setIsOpen={setShowProductList}
          productName={productSelected?.product?.name || ''}
        />
        <div>
          <InputV4
            type="number"
            bgColor="gray-light"
            border
            placeholder={`Cantidad`}
            name="quantityRemoved"
            value={productSelected?.quantityRemoved || ''}
            onChange={(e) => handleInputChange(e, 'number')}
          />
        </div>
        <div>
          <InputV4
            value={productSelected?.motive || ''}
            placeholder="Motivo"
            name="motive"
            onChange={handleInputChange}
            border
            bgColor="gray-light"
          />
        </div>
        <div>
          <InputV4
            value={productSelected?.observations || ''}
            placeholder="Observaciones"
            name="observations"
            onChange={handleInputChange}
            border
            bgColor="gray-light"
          />
        </div>
        <div>
          <Button
            title={<FontAwesomeIcon icon={faPlus} />}
            width="icon32"
            border="light"
            borderRadius="normal"
            onClick={handleAddToProductOutflow}
          />
        </div>
      </Row>
    </Container>
  );
};
const Container = styled.div`
  position: relative;
  z-index: 2;
  display: grid;
  gap: 0.2em;
  padding: 0.2em 1em 0.4em;
  background-color: var(--white);
`;
const Row = styled.div<RowProps>`
  color: rgb(37 37 37);
  display: grid;
  position: relative;
  gap: 1em;

  ${(props: RowProps) =>
    props.$columns &&
    `
    grid-template-columns: ${props.$columns.map((col: TableHeaderColumn) => col.width).join(' ')};
    `}
`;
const Col = styled.div`
  display: flex;
  align-items: center;
  min-width: 2em;
  font-weight: 500;

  span {
    font-size: 12px;
    line-height: 12px;
  }
`;
const Group = styled.div`
  display: flex;
  gap: 0.5em;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0.5em;
  cursor: pointer;
  background-color: var(--white);
  border: 1px solid var(--gray-300);
  border-radius: 0.5em;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: var(--gray-100);
  }

  span {
    font-size: 12px;
    line-height: 12px;
  }
`;
