import { Button as AntdButton } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { openModalUpdateProd } from '@/features/modals/modalSlice';
import {
  ChangeProductData,
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';

export const AddProductButton = () => {
  const dispatch = useDispatch();
  const { product } = useSelector(selectUpdateProductData);

  const Open = () => {
    dispatch(openModalUpdateProd());
    dispatch(
      ChangeProductData({ product, status: OPERATION_MODES.CREATE.label }),
    );
  };

  return (
    <AntdButton title="Producto" onClick={Open} icon={icons.operationModes.add}>
      Producto
    </AntdButton>
  );
};
