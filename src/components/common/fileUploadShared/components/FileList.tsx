import {
  FileOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileImageOutlined,
  FilePdfOutlined,
} from '@/constants/icons/antd';
import { Empty, Tooltip } from 'antd';
import { useMemo } from 'react';

import {
  DeleteButton,
  FileGroup,
  FileIcon,
  FileInfo,
  FileItem,
  FileListContainer,
  GroupTitle,
  PreviewButton,
  TypeTag,
} from './FileList.styles';
import { isImageFile, isPDFFile } from '@/utils/fileUtils';

import type { PreviewableFile } from '../types';

type FileGroupState<TFile extends PreviewableFile> = {
  title: string;
  files: TFile[];
};

export type FileListProps<TFile extends PreviewableFile = PreviewableFile> = {
  files?: TFile[];
  removeFile?: (fileId: string) => void;
  handlePreview?: (file: TFile) => void;
  fileTypeLabels?: Record<string, string>;
  getGroupType?: (file: TFile) => string;
  getRemoveFileId?: (file: TFile) => string | undefined;
};

const EMPTY_FILE_LIST: PreviewableFile[] = [];
const EMPTY_FILE_TYPE_LABELS: Record<string, string> = {};

const TYPE_TAG_COLORS: Record<string, string> = {
  document: 'default',
  receipts: 'green',
  invoices: 'blue',
  others: 'orange',
  imagen: 'purple',
  image: 'purple',
  pdf: 'red',
};

const getTagColor = (type?: string) => {
  if (!type) return 'default';
  return TYPE_TAG_COLORS[type.toLowerCase()] || 'default';
};

const getTypeTitle = (
  type: string,
  fileTypeLabels: Record<string, string>,
) => fileTypeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1);

const FileList = <TFile extends PreviewableFile>({
  files = EMPTY_FILE_LIST as TFile[],
  removeFile,
  handlePreview,
  fileTypeLabels = EMPTY_FILE_TYPE_LABELS,
  getGroupType,
  getRemoveFileId,
}: FileListProps<TFile>) => {
  const groupedFiles = useMemo(() => {
    const groups: Record<string, FileGroupState<TFile>> = {};

    files.forEach((file) => {
      const type = getGroupType?.(file) ?? file.type?.toLowerCase() ?? 'document';

      if (!groups[type]) {
        groups[type] = {
          title: getTypeTitle(type, fileTypeLabels),
          files: [],
        };
      }

      groups[type].files.push(file);
    });

    return Object.entries(groups);
  }, [files, fileTypeLabels, getGroupType]);

  const renderFileItem = (file: TFile) => {
    const fileName = file.name ?? '';
    const fileKey = file.id ?? file.url ?? fileName;
    const removeFileId = getRemoveFileId?.(file) ?? file.id ?? file.url;
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
            {file.type
              ? fileTypeLabels[file.type.toLowerCase()] || file.type
              : 'Documento'}
          </TypeTag>
          <TypeTag color={file.url ? 'purple' : 'blue'}>
            {file.url ? 'Remoto' : 'Local'}
          </TypeTag>
        </FileInfo>
        <div>
          {canPreview && handlePreview ? (
            <PreviewButton onClick={() => handlePreview(file)}>
              <EyeOutlined />
            </PreviewButton>
          ) : null}
          {removeFile && removeFileId ? (
            <DeleteButton onClick={() => removeFile(removeFileId)}>
              <DeleteOutlined />
            </DeleteButton>
          ) : null}
        </div>
      </FileItem>
    );
  };

  if (!files.length) {
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
