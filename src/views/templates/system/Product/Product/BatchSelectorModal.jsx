import { Modal, Select } from 'antd';
import React, { useState } from 'react'
import { useSelector } from 'react-redux';

import { selectUser } from '../../../../../features/auth/userSlice';
import useListenBatches from '../../../../../hooks/products/useListenBatch';

const { Option } = Select;

export const BatchSelectorModal = ({isOpen, onClose, onAdd, productId}) => {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const user = useSelector(selectUser);
    const { batches } = useListenBatches(user, productId);

  return (
    <Modal
    title="Select Batch"
    open={isOpen}
    onOk={() => onAdd(selectedBatch)}
    onCancel={() => {
        setSelectedBatch(null);
        onClose();
    }}
>
    <Select
        style={{ width: '100%' }}
        placeholder="Select a batch"
        onChange={(value) => setSelectedBatch(value)}
    >
         {batches.map((batch) => (
                <Option key={batch.id} value={batch.id}>
                  {batch.shortName}
                </Option>
              ))}
    </Select>
</Modal>
  )
}
