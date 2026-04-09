import { Tabs } from 'antd';
import React, { useMemo } from 'react';

import { General } from './components/General/General';

type ProductFormProps = {
  showImageManager: () => void;
};

export const ProductForm = ({ showImageManager }: ProductFormProps) => {
  const items = useMemo(
    () => [
      {
        key: '1',
        label: 'General',
        children: <General showImageManager={showImageManager} />,
      },
      // {
      //     key: '2',
      //     label: 'Lote',
      //     disabled: status === "create",
      //     children: <BatchList/>
      // },
      // {
      //     key: '3',
      //     label: 'Unidades de Venta', // Nuevo label para la tercera pestaña
      //     disabled: status === "create",
      //     children: <SaleUnitsConfig />
      // },
    ],
    [showImageManager],
  );
  return <Tabs defaultActiveKey="1" items={items} />;
};
