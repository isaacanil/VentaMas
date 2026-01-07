// @ts-nocheck
import { Button, Tooltip } from 'antd';
import { useDispatch } from 'react-redux';

import { openFileCenter } from '@/features/files/fileSlice';
import { truncateString } from '@/utils/text/truncateString';

interface AttachmentSummary {
  id: string | number;
  name?: string | null;
  [key: string]: unknown;
}

interface ShowFilesProps {
  value?: AttachmentSummary[] | null;
}

const normalizeFiles = (
  rawValue?: AttachmentSummary[] | null,
): AttachmentSummary[] => {
  if (!Array.isArray(rawValue)) return [];

  return rawValue.filter(
    (file): file is AttachmentSummary =>
      Boolean(file) && typeof file === 'object' && 'id' in file,
  );
};

export function ShowFiles({ value }: ShowFilesProps) {
  const dispatch = useDispatch();
  const files = normalizeFiles(value);

  const handleShowFiles = () => {
    if (!files.length) return;
    dispatch(openFileCenter(files));
  };

  const tooltipContent = files.length ? (
    <div style={{ maxWidth: '300px' }}>
      <div
        style={{
          borderBottom: '1px solid #eee',
          marginBottom: '8px',
          paddingBottom: '4px',
        }}
      >
        Total archivos: {files.length}
      </div>
      <ol style={{ margin: 0, paddingLeft: '20px' }}>
        {files.map((file) => (
          <li key={file.id} style={{ marginBottom: '4px' }}>
            {truncateString(String(file.name ?? ''), 24)}
          </li>
        ))}
      </ol>
    </div>
  ) : (
    'Sin archivos'
  );

  return (
    <Tooltip title={tooltipContent} placement="topLeft">
      <Button onClick={handleShowFiles} disabled={!files.length}>
        Ver
      </Button>
    </Tooltip>
  );
}
