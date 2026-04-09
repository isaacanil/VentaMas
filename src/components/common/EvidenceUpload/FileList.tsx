import {
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from '@/constants/icons/antd';
import { Tag, Empty, Tooltip } from 'antd';
import { useMemo } from 'react';
import styled from 'styled-components';
import { isImageFile, isPDFFile } from '@/utils/fileUtils';
import type { EvidenceFile } from './types';

const FileListContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #f5f5f5;
  }
`;

const FileInfo = styled.div`
  flex: 1;
  margin-left: 10px;
`;

const DeleteButton = styled.button`
  padding: 5px;
  color: #ff4d4f;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #cf1322;
  }
`;

const TypeTag = styled(Tag)`
  margin-left: 8px;
  font-size: 11px;
`;

const FileGroup = styled.div`
  margin-bottom: 16px;
`;

const PreviewButton = styled.button`
  padding: 5px;
  margin-right: 8px;
  color: #1890ff;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #40a9ff;
  }
`;

const GroupTitle = styled.h4`
  margin: 12px 0;
  font-weight: 500;
  color: #666;
`;

const FileIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 8px;
  font-size: 16px;
`;

interface FileListProps {
  files?: EvidenceFile[];
  removeFile?: (fileId: string) => void;
  handlePreview?: (file: EvidenceFile) => void;
}

const EMPTY_EVIDENCE_FILES: EvidenceFile[] = [];

const FileList = ({
  files = EMPTY_EVIDENCE_FILES,
  removeFile,
  handlePreview,
}: FileListProps) => {
  const getTagColor = (type?: string) => {
    const colors = {
      receipts: 'green',
      invoices: 'blue',
      others: 'orange',
    };
    return colors[type?.toLowerCase() ?? ''] || 'default';
  };

  const groupedFiles = useMemo(() => {
    const groups: Record<string, { title: string; files: EvidenceFile[] }> = {
      receipts: { title: 'Recibos', files: [] },
      invoices: { title: 'Facturas', files: [] },
      others: { title: 'Otros Documentos', files: [] },
    };

    files?.forEach((file) => {
      const type = typeof file.type === 'string' ? file.type.toLowerCase() : '';
      const targetGroup = groups[type] || groups.others;
      targetGroup.files.push(file);
    });

    return Object.entries(groups).filter(
      ([_, group]) => group.files.length > 0,
    );
  }, [files]);

  const renderFileItem = (file: EvidenceFile) => {
    const fileKey = file.id ?? file.url ?? file.name ?? '';
    const fileName = file.name ?? '';
    const canPreview = isImageFile(fileName) || isPDFFile(fileName);

    return (
      <FileItem key={fileKey}>
        <FileIcon>
          {isImageFile(fileName) ? (
            <FileImageOutlined style={{ color: '#52c41a' }} />
          ) : isPDFFile(fileName) ? (
            <FilePdfOutlined style={{ color: '#ff4d4f' }} />
          ) : (
            <FileOutlined />
          )}
        </FileIcon>
        <FileInfo>
          <Tooltip title={fileName}>{fileName || 'Archivo sin nombre'}</Tooltip>
          <TypeTag color={getTagColor(file.type)}>
            {file.type || 'Otros'}
          </TypeTag>
          <TypeTag color={file.url ? 'purple' : 'blue'}>
            {file.url ? 'Remoto' : 'Local'}
          </TypeTag>
        </FileInfo>
        <div>
          {canPreview && handlePreview && (
            <PreviewButton onClick={() => handlePreview(file)}>
              <EyeOutlined />
            </PreviewButton>
          )}
          {removeFile && fileKey && (
            <DeleteButton onClick={() => removeFile(fileKey)}>
              <DeleteOutlined />
            </DeleteButton>
          )}
        </div>
      </FileItem>
    );
  };

  if (!files?.length) {
    return <Empty description="No hay archivos adjuntos" />;
  }

  return (
    <FileListContainer>
      {groupedFiles.map(([type, group]) => (
        <FileGroup key={type}>
          <GroupTitle>{group.title}</GroupTitle>
          {group.files.map(renderFileItem)}
        </FileGroup>
      ))}
    </FileListContainer>
  );
};

export default FileList;
