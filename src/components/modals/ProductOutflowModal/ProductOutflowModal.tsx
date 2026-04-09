import { Button, Input, message } from 'antd';
import type { ChangeEvent } from 'react';
import { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { icons } from '@/constants/icons/icons';
import { selectUser } from '@/features/auth/userSlice';
import { toggleAddProductOutflow } from '@/features/modals/modalSlice';
import {
  deleteData,
  deleteProductFromProductOutflow,
  SelectProductList,
  SelectProductOutflow,
  updateProductFromProductOutflow,
  type ProductOutflowState as SliceProductOutflowState,
} from '@/features/productOutflow/productOutflow';
import { fbAddProductOutFlow } from '@/firebase/ProductOutflow/fbAddProductOutflow';
import { fbRemoveOutputRestoreQuantity } from '@/firebase/ProductOutflow/fbRemoveOutputRestoreQuantity';
import { fbUpdateProductOutflow } from '@/firebase/ProductOutflow/fbUpdateProductOutflow';
import useScroll from '@/hooks/useScroll';
import { Modal } from '@/components/modals/Modal';
import { CenteredText } from '@/components/ui/CentredText';
import { FormattedValue } from '@/components/ui/FormattedValue/FormattedValue';
import type { UserIdentity, UserWithBusiness } from '@/types/users';
import type { ProductRecord } from '@/types/products';

import { OutputProductEntry } from './OutputProductEntry/OutputProductEntry';

type DraftProductOutflowItem = {
  id: string;
  product?: ProductRecord | null;
  motive?: string;
  quantityRemoved?: number;
  observations?: string;
  status?: boolean;
  date?: string | number | Date;
};

type ProductOutflowItem = {
  id: string;
  product: ProductRecord;
  motive?: string;
  quantityRemoved: number;
  observations?: string;
  status?: boolean;
  date?: string | number | Date;
};

type DraftProductOutflowData = {
  productList: DraftProductOutflowItem[];
  id?: string;
  [key: string]: unknown;
};

type UserInfo = UserIdentity;

type ProductOutflowModalProps = {
  isOpen: boolean;
  mode?: 'create' | 'update';
};

export const ProductOutflowModal = ({
  isOpen,
  mode = 'create',
}: ProductOutflowModalProps) => {
  const outFlowList =
    (useSelector(SelectProductList) as DraftProductOutflowItem[]) || [];
  const outFlowProduct = useSelector(
    SelectProductOutflow,
  ) as SliceProductOutflowState;
  const dispatch = useDispatch();
  const user = useSelector(selectUser) as UserInfo | null;
  const hasBusiness = (
    candidate: UserInfo | null,
  ): candidate is UserWithBusiness => Boolean(candidate?.businessID);
  const hasBusinessAndUid = (
    candidate: UserInfo | null,
  ): candidate is UserWithBusiness & { uid: string } =>
    Boolean(candidate?.businessID && candidate?.uid);

  const normalizeOutflowData = (
    data: DraftProductOutflowData,
  ): DraftProductOutflowData & { productList: ProductOutflowItem[] } => {
    const productList = data.productList
      .filter(
        (item): item is DraftProductOutflowItem & { product: ProductRecord } =>
          Boolean(item.product),
      )
      .map((item) => ({
        ...item,
        product: item.product as ProductRecord,
        quantityRemoved: Number(item.quantityRemoved ?? 0),
      }));
    return { ...data, productList };
  };

  const onClose = () => {
    dispatch(toggleAddProductOutflow(undefined));
    dispatch(deleteData(undefined));
  };

  const handleDeleteProductOutflow = (item: DraftProductOutflowItem) => {
    if (!hasBusiness(user)) {
      message.error('No se encontró un negocio válido.');
      return;
    }
    if (item.product) {
      fbRemoveOutputRestoreQuantity(user, {
        product: item.product,
        totalRemovedQuantity: Number(item.quantityRemoved ?? 0),
      });
    }
    dispatch(deleteProductFromProductOutflow({ id: item.id }));
  };
  const handleUpdateProductOutflow = async () => {
    try {
      if (!hasBusiness(user)) {
        message.error('No se encontró un negocio válido.');
        return;
      }
      await fbUpdateProductOutflow(user, normalizeOutflowData(outFlowProduct.data));
    } catch (error) {
      console.error('Error updating product outflow', error);
    }
  };
  const handleAddOutflow = async () => {
    try {
      if (!hasBusinessAndUid(user)) {
        message.error('No se encontró un usuario válido.');
        return;
      }
      await fbAddProductOutFlow(user, normalizeOutflowData(outFlowProduct.data));
    } catch (error) {
      console.error('Error creating product outflow', error);
    }
  };
  const handleSubmit = async () => {
    if (mode === 'create') {
      await handleAddOutflow();
    }
    if (mode === 'update') {
      await handleUpdateProductOutflow();
    }
  };
  const handleUpdateProduct = (
    id: string,
    updatedFields: Partial<ProductOutflowItem>,
  ) => {
    dispatch(updateProductFromProductOutflow({ id, data: updatedFields }));
  };

  const tableRef = useRef<HTMLDivElement | null>(null);
  const isScrolled = useScroll(tableRef);
  const getTimestamp = (value?: ProductOutflowItem['date']) => {
    if (value instanceof Date) {
      return value.getTime();
    }
    return new Date(value ?? 0).getTime();
  };
  const sortedOutflows = outFlowList
    .slice()
    .sort((a, b) => getTimestamp(a.date) - getTimestamp(b.date))
    .reverse();
  return (
    <Modal
      width={'large'}
      isOpen={isOpen}
      btnSubmitName={'Guardar'}
      nameRef={
        mode === 'create'
          ? 'Agregar Salida de Producto'
          : 'Editar Salida de Producto'
      }
      handleSubmit={handleSubmit}
      close={onClose}
    >
      <Container>
        <Header>
          <OutputProductEntry />
        </Header>
        <Body>
          <Table ref={tableRef}>
            <TableHeader $isScrolled={isScrolled}>
              <FormattedValue type={'subtitle-table'} value="#" />
              <FormattedValue type={'subtitle-table'} value="Producto" />
              <FormattedValue type={'subtitle-table'} value="Cantidad" />
              <FormattedValue type={'subtitle-table'} value="Motivo" />
              <FormattedValue type={'subtitle-table'} value="Observaciones" />
              <FormattedValue type={'subtitle-table'} value="Acción" />
            </TableHeader>
            <TableItems>
              {(outFlowList?.length > 0 &&
                sortedOutflows.map((item, index) => (
                  <Row key={item.id ?? index}>
                    <FormattedValue
                      type={'number'}
                      value={outFlowList?.length - index}
                    />
                    <FormattedValue type={'text'} value={item?.product?.name} />
                    <Input
                      type="number"
                      value={item?.quantityRemoved ?? ''}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleUpdateProduct(item.id, {
                          quantityRemoved: Number(e.target.value),
                        })
                      }
                    />
                    <Input
                      value={item?.motive || 'none'}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleUpdateProduct(item.id, {
                          motive: e.target.value,
                        })
                      }
                    />
                    <Input
                      value={item?.observations || 'none'}
                      onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        handleUpdateProduct(item.id, {
                          observations: e.target.value,
                        })
                      }
                    />
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'right',
                      }}
                    >
                      <Button
                        danger
                        icon={icons.operationModes.delete}
                        onClick={() => handleDeleteProductOutflow(item)}
                      />
                    </div>
                  </Row>
                ))) || (
                <CenteredText
                  text={
                    mode === 'create'
                      ? 'Seleccione un producto para agregar una salida de producto, y rellene los campos de cantidad, motivo y observaciones'
                      : 'No hay registros de salida de productos'
                  }
                />
              )}
            </TableItems>
          </Table>
        </Body>
      </Container>
    </Modal>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  height: 100%;
  overflow: hidden;
`;
const Header = styled.div`
  width: 100%;
`;
const Body = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: hidden;
`;
const Table = styled.div`
  width: 100%;
  max-width: 1100px;
  height: 100%;
  margin: 0 auto;
  overflow-y: hidden;
  background-color: aliceblue;
  background-color: var(--white);
`;
const TableItems = styled.div`
  position: relative;
  display: grid;
  align-content: flex-start;
  align-items: flex-start;
  height: calc(100% - 2.6em);
  overflow-y: scroll;
`;

const TableHeader = styled.div<{ $isScrolled: boolean }>`
  display: grid;
  grid-template-columns: 3em 1fr 1fr 1fr 1fr 5em;
  align-items: center;
  background-color: var(--white);
  padding: 8px 24px 8px 8px;
  gap: 1em;
  font-size: 14px;
  font-weight: bold;
  position: sticky;
  top: 0;
  border-bottom: 1px solid transparent;
  z-index: 1;
  transition: all 0.2s linear;
  ${(props: { $isScrolled: boolean }) =>
    props.$isScrolled &&
    `
    background-color: var(--white);
    border-bottom: 1px solid rgba(0, 0, 0, 0.100);
  `}
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: 3em 1fr 1fr 1fr 1fr 5em;
  gap: 1em;
  align-items: center;
  padding: 8px;
  font-size: 14px;
  border-radius: 4px;
  transition: all 0.2s linear;

  &:hover {
    background-color: #f5f5f5;
  }
`;
