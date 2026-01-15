import { Button, notification } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';

import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import { toggleAddProductOutflow } from '@/features/modals/modalSlice';
import {
  SelectProductOutflow,
  setProductOutflowData,
} from '@/features/productOutflow/productOutflow';
import { fbDeleteProductOutflow } from '@/firebase/ProductOutflow/fbDeleteProductOutflow';
import { fbGetProductOutflow } from '@/firebase/ProductOutflow/fbGetProductOutflow';
import useScroll from '@/hooks/useScroll';
import DateUtils from '@/utils/date/dateUtils';
const { formatDate, toMillis } = DateUtils;
import { ButtonGroup } from '@/components/ui/Button/ButtonGroup';
import { CenteredText } from '@/components/ui/CentredText';
import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';
import Loader from '@/components/ui/loader/Loader';
import type { InventoryUser } from '@/utils/inventory/types';

import { Header } from './components/Header/Header';
import {
  ProductOutflowDataFormatter,
  toggleProductOutflowModal,
} from './toggleProductOutflowModal';

type ProductOutflowItem = {
  id?: string | null;
  product?: string | null;
  motive?: string;
  quantityRemoved?: number;
  observations?: string;
  status?: boolean;
};

type ProductOutflowRecord = {
  id?: string | null;
  productList?: ProductOutflowItem[];
  createdAt?: any;
  date?: any;
};

type ProductOutflowState = ReturnType<typeof SelectProductOutflow>;

export const ProductOutflow = () => {
  const dispatch = useDispatch();
  const tableRef = useRef<HTMLDivElement | null>(null);
  const [outflowList, setOutflowList] = useState<ProductOutflowRecord[]>([]);
  const outflowProduct = useSelector(SelectProductOutflow) as ProductOutflowState;
  const [outflowListLoader, setOutflowListLoader] = useState(true);
  const isScrolled = useScroll(tableRef);
  const user = useSelector(selectUser) as InventoryUser | null;

  const handleClick = () => {
    dispatch(toggleAddProductOutflow());
  };

  const handleDeleteProductOutflow = async (item: ProductOutflowRecord) => {
    try {
      await fbDeleteProductOutflow(user, item);
      notification.success({
        message: 'Salida de producto eliminada',
      });
    } catch {
      notification.error({
        message: 'Error al eliminar la salida de producto',
      });
    }
  };

  useEffect(() => {
    const productOutflowList = outflowList.find(
      (item) => (item?.productList ?? []).length === 0,
    );

    if (productOutflowList) {
      if (user) {
        fbDeleteProductOutflow(user, productOutflowList);
      }
    }
  }, [outflowList, user]);
  useEffect(() => {
    if (outflowProduct.mode === OPERATION_MODES.UPDATE.id) {
      outflowList.forEach((doc) => {
        if (doc.id === outflowProduct.data.id) {
          dispatch(setProductOutflowData({ data: doc }));
        }
      });
    }
  }, [outflowList, dispatch, outflowProduct.mode, outflowProduct.data.id]);

  useEffect(() => {
    fbGetProductOutflow({
      user,
      setOutflowList,
      setOutflowListLoader,
    });
  }, [user]);

  return (
    <Container>
      <Header />
      <Table ref={tableRef}>
        <TableHeader isScrolled={isScrolled}>
          <FormattedValue type={'subtitle-table'} value={'#'} />
          <FormattedValue type={'subtitle-table'} value={'Fechas'} />
          <FormattedValue
            type={'subtitle-table'}
            value={'Cantidad de productos'}
          />
          <FormattedValue type={'subtitle-table'} value={'Acción'} />
        </TableHeader>
        <TableItems>
          <Loader
            theme="light"
            useRedux={false}
            show={outflowListLoader}
            message={'Cargando lista de salidas de productos'}
          />
          {outflowListLoader ? null : outflowList.length > 0 ? (
            outflowList
              .sort((a, b) => {
                const aMillis = toMillis(a.createdAt as unknown) ?? 0;
                const bMillis = toMillis(b.createdAt as unknown) ?? 0;
                return aMillis - bMillis;
              })
              .reverse()
              .map((item, index) => (
                <Row key={item.id ?? index}>
                  <FormattedValue
                    type={'number'}
                    value={outflowList.length - index}
                  />
                  {formatDate(item?.createdAt)}

                  <span>
                    <FormattedValue
                      type={'number'}
                      value={(item.productList ?? []).reduce((total, item) => {
                        return total + Number(item?.quantityRemoved ?? 0);
                      }, 0)}
                    />
                  </span>
                  <ButtonGroup>
                    <Button
                      icon={icons.operationModes.edit}
                      onClick={() =>
                        toggleProductOutflowModal({
                          mode: OPERATION_MODES.UPDATE.label,
                          data: new ProductOutflowDataFormatter(item),
                          dispatch,
                        })
                      }
                    />
                    <Button
                      icon={icons.operationModes.delete}
                      danger
                      onClick={() => handleDeleteProductOutflow(item)}
                    />
                  </ButtonGroup>
                </Row>
              ))
          ) : (
            <CenteredText
              text="Crea un nuevo registro de salida de productos"
              buttonText={'Nueva Salida'}
              handleAction={handleClick}
            />
          )}
        </TableItems>
      </Table>
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content auto 1fr;
  gap: 16px;
  height: 100%;
  background-color: var(--color2);
`;

const Table = styled.div`
  position: relative;
  width: 100%;
  max-width: 1000px;
  height: calc(100vh - 200px);
  margin: 0 auto;
  overflow-y: scroll;
  background-color: aliceblue;
  background-color: var(--white);
  border: 1px solid rgb(0 0 0 / 1%);
  border-radius: var(--border-radius);
`;
const TableItems = styled.div`
  display: grid;
  align-content: flex-start;
  height: calc(100% - 2.6em);
`;
const TableHeader = styled.div<{ isScrolled?: boolean }>`
  display: grid;
  grid-template-columns: 6em 1fr 1fr 5em;
  align-items: center;
  background-color: var(--white);
  padding: 8px;
  font-size: 14px;
  font-weight: bold;
  position: sticky;
  top: 0;
  border: 1px solid rgb(0 0 0 / 0%);
  transition: all 0.2s linear;
  ${({ isScrolled }: { isScrolled?: boolean }) =>
    isScrolled &&
    `
    border-bottom: 1px solid rgba(0, 0, 0, 0.100);
    background-color: #ffffffdf;
    backdrop-filter: blur(10px);
    `}
`;
const Row = styled.div`
  display: grid;
  grid-template-columns: 6em 1fr 1fr 5em;
  align-items: center;
  padding: 8px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s linear;

  &:hover {
    background-color: #f5f5f5;
  }
`;
