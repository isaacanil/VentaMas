import { Drawer } from 'antd';
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';

import {
  closeFileCenter,
  selectFileCenter,
} from '@/features/files/fileSlice';
import EvidenceUpload from '@/views/pages/OrderAndPurchase/PurchaseManagement/components/EvidenceUpload/EvidenceUpload';

function EvidenceUploadDrawer() {
  const dispatch = useDispatch();
  const { files, open } = useSelector(selectFileCenter);

  const handleClose = () => dispatch(closeFileCenter());

  return (
    <Drawer
      title="Subir Evidencia"
      placement="right"
      onClose={handleClose}
      open={open}
      size="large"
    >
      <EvidenceUpload attachmentUrls={files} />
    </Drawer>
  );
}

export default EvidenceUploadDrawer;
