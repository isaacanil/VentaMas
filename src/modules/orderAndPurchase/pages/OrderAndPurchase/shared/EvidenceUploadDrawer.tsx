import { Drawer, type DrawerProps } from 'antd';
import { useDispatch, useSelector } from 'react-redux';

import EvidenceUpload from '@/components/common/EvidenceUpload/EvidenceUpload';
import type { EvidenceFile } from '@/components/common/EvidenceUpload/types';
import { closeFileCenter, selectFileCenter } from '@/features/files/fileSlice';

interface EvidenceUploadDrawerProps {
  drawerProps?: Pick<DrawerProps, 'size' | 'width'>;
}

function EvidenceUploadDrawer({ drawerProps }: EvidenceUploadDrawerProps = {}) {
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
      {...drawerProps}
    >
      <EvidenceUpload attachmentUrls={files} />
    </Drawer>
  );
}

export default EvidenceUploadDrawer;
