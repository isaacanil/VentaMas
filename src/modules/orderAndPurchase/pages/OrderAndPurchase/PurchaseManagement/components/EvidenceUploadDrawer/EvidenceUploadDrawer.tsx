import { Drawer } from 'antd';
import { useSelector, useDispatch } from 'react-redux';

import {
  closeFileCenter,
  selectFileCenter,
} from '@/features/files/fileSlice';
import EvidenceUpload from '@/components/common/EvidenceUpload/EvidenceUpload';
import type { EvidenceFile } from '@/components/common/EvidenceUpload/types';

function EvidenceUploadDrawer() {
  const dispatch = useDispatch();
  const { files, open } = useSelector(selectFileCenter) as {
    files: EvidenceFile[];
    open: boolean;
  };

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
