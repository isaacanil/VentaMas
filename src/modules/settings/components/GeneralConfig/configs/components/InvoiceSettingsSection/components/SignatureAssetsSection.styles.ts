import { Tabs } from 'antd';
import styled from 'styled-components';

export const ToggleRow = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  justify-content: space-between;
`;

export const ToggleMeta = styled.div`
  display: grid;
  gap: 4px;
`;

export const ToggleTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #262626;
`;

export const ToggleHint = styled.p`
  margin: 0;
  font-size: 12px;
  line-height: 1.4;
  color: #6b7280;
`;

export const AssetCard = styled.div`
  padding: 16px;
  background: #fcfcfd;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
`;

export const AssetTabs = styled(Tabs)`
  .ant-tabs-nav {
    margin-bottom: 16px;
  }

  .ant-tabs-tab {
    padding: 8px 0;
    font-weight: 600;
  }
`;

export const AssetPreview = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 140px;
  margin-bottom: 12px;
  overflow: hidden;
  background:
    linear-gradient(45deg, #f8fafc 25%, transparent 25%),
    linear-gradient(-45deg, #f8fafc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #f8fafc 75%),
    linear-gradient(-45deg, transparent 75%, #f8fafc 75%);
  background-position:
    0 0,
    0 9px,
    9px -9px,
    -9px 0;
  background-size: 18px 18px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;

  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`;

export const AssetPlaceholder = styled.span`
  font-size: 12px;
  color: #98a2b3;
`;

export const AssetActions = styled.div`
  display: flex;
  gap: 8px;

  .ant-upload {
    width: 100%;
  }

  button {
    flex: 1;
  }
`;

export const UploadStatus = styled.p`
  min-height: 18px;
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: #2563eb;
`;

export const AssetNote = styled.p`
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 1.45;
  color: #6b7280;
`;

export const ControlGroup = styled.div`
  display: grid;
  gap: 12px;
  padding-top: 14px;
  margin-top: 14px;
  border-top: 1px solid #e5e7eb;
`;

export const ControlRow = styled.div`
  display: grid;
  gap: 6px;
`;

export const SliderRow = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
  align-items: center;
`;

export const FineTuneButtons = styled.div`
  display: inline-flex;
  gap: 6px;
`;

export const ControlLabelRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  color: #475467;
`;

export const ControlValue = styled.span`
  font-variant-numeric: tabular-nums;
  color: #667085;
`;

export const ControlActions = styled.div`
  display: flex;
  gap: 8px;

  button {
    flex: 1;
  }
`;
