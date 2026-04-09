import { Button as AntdButton, Dropdown } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { PlusOutlined, ToolOutlined } from '@/constants/icons/antd';
import { icons } from '@/constants/icons/icons';
import { OPERATION_MODES } from '@/constants/modes';
import { selectUser } from '@/features/auth/userSlice';
import { openModalUpdateProd } from '@/features/modals/modalSlice';
import {
  ChangeProductData,
  selectUpdateProductData,
} from '@/features/updateProduct/updateProductSlice';

export const AddProductButton = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { product } = useSelector(selectUpdateProductData);

  const handleOpen = () => {
    dispatch(openModalUpdateProd());
    dispatch(
      ChangeProductData({ product, status: OPERATION_MODES.CREATE.label }),
    );
  };

  if (user?.role === 'dev') {
    return (
      <Dropdown
        menu={{
          items: [
            {
              label: 'Crear producto',
              key: '1',
              icon: <PlusOutlined />,
               onClick: handleOpen,
            },
            {
              label: 'Crear en ProductStudio',
              key: '2',
              icon: <ToolOutlined />,
              onClick: () => navigate('/inventory/product-studio'),
            },
          ],
        }}
        placement="bottomRight"
      >
        <AntdButton title="Producto" icon={icons.operationModes.add}>
          Producto
        </AntdButton>
      </Dropdown>
    );
  }

  return (
    <AntdButton
      title="Producto"
      onClick={handleOpen}
      icon={icons.operationModes.add}
    >
      Producto
    </AntdButton>
  );
};
