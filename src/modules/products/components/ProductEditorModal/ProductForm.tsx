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
    ],
    [showImageManager],
  );
  return <Tabs defaultActiveKey="1" items={items} />;
};
