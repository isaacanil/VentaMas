import { Form } from 'antd';
import styled from 'styled-components';

import { MainLayoutModal } from '@/components/common/Modal/Modal';

export const MainLayout = styled(MainLayoutModal).attrs({
  $hasSecondary: true,
  $secondaryWidth: '480px',
  $secondaryPosition: 'left',
  $bodyHeight: '100%',
  $viewportOffset: '60px',
  $minBodyHeight: '520px',
})`
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  overflow: hidden;
`;

export const ConfigSidebar = styled.div`
  padding: 12px 16px;
  border-right: 1px solid #f0f0f0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fafafaff;
  min-height: 0;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: #e5e7eb;
    border-radius: 10px;
  }
`;

export const PreviewCanvas = styled.div`
  background: #f0f2f5;
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: stretch;
  min-height: 0;
  position: relative;

  @media (width <= 1100px) {
    min-height: 65vh;
  }
`;

export const StyledForm = styled(Form)`
  .ant-form-item-label > label {
    font-weight: 600;
    color: #262626;
    font-size: 14px;
  }

  .ant-input-textarea {
    border-radius: 12px;
    padding: 12px 16px;
    transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
    border: 1px solid #d9d9d9;
    background: #fdfdfd;

    &:hover {
      border-color: #1890ff;
    }

    &:focus {
      border-color: #1890ff;
      background: #fff;
      box-shadow: 0 0 0 4px rgb(24 144 255 / 10%);
    }
  }
`;

export const SectionHeader = styled.div`
  margin-bottom: 10px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 700;
    color: #262626;
  }

  p {
    margin: 4px 0 0;
    color: #8c8c8c;
    font-size: 13px;
  }
`;

export const SectionWrapper = styled.div`
  padding: 16px;
  border: 1px solid #f0f0f0;
  border-radius: 10px;
  background: #fff;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  gap: 12px;

  &:hover {
    border-color: #e5e7eb;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }
`;
