import { Tag } from 'antd';
import styled from 'styled-components';

export const FileListContainer = styled.div`
  max-height: 300px;
  overflow-y: auto;
`;

export const FileItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 1px solid #f0f0f0;

  &:hover {
    background-color: #f5f5f5;
  }
`;

export const FileInfo = styled.div`
  flex: 1;
  margin-left: 10px;
`;

export const DeleteButton = styled.button`
  padding: 5px;
  color: #ff4d4f;
  cursor: pointer;
  background: none;
  border: none;

  &:hover {
    color: #cf1322;
  }
`;

export const TypeTag = styled(Tag)`
  margin-left: 8px;
  font-size: 11px;
`;

export const FileGroup = styled.div`
  margin-bottom: 16px;
`;

export const PreviewButton = styled.button`
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

export const GroupTitle = styled.h4`
  margin: 12px 0;
  font-weight: 500;
  color: #666;
`;

export const FileIcon = styled.span`
  display: flex;
  align-items: center;
  margin-right: 8px;
  font-size: 16px;
`;
