import { Select } from 'antd';
import React from 'react';

import OrderSelector from '../OrderSelector';
import ProviderSelector from '../ProviderSelector';

const { Option } = Select;

const SupplierOrderSelection = ({ supplierName, orderSelection, onChange }) => (
  <div>
    <ProviderSelector />
    <OrderSelector />
  </div>
);

export default SupplierOrderSelection;
