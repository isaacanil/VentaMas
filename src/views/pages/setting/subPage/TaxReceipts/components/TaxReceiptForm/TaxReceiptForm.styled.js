import { Form } from "antd";
import styled from "styled-components";

export const ModalLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;

  @media (min-width: 992px) {
    grid-template-columns: 2fr 1fr;
    align-items: start;
  }
`;

export const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  row-gap: 8px;
  column-gap: 16px;
`;

export const FullRow = styled.div`
  grid-column: 1 / -1;
  min-width: 0;
`;

export const Span6 = styled.div`
  grid-column: span 6;
  min-width: 0;
`;

export const Span8 = styled.div`
  grid-column: span 8;
  min-width: 0;
`;

export const Span4 = styled.div`
  grid-column: span 4;
  min-width: 0;
`;

export const Span12 = styled.div`
  grid-column: span 12;
  min-width: 0;
`;

export const MobileOnly = styled.div`
  @media (min-width: 992px) {
    display: none;
  }
`;

export const DesktopOnly = styled.aside`
  display: none;

  @media (min-width: 992px) {
    display: block;
  }
`;

export const SequenceActionItem = styled(Form.Item)`
  margin-bottom: 24px;

  .ant-form-item-label > label {
    visibility: hidden;
  }

  .ant-form-item-control-input-content {
    display: flex;
  }

  .ant-btn {
    width: 100%;
  }
`;

export const AsidePanel = styled.div`
  position: sticky;
  top: 0;
  padding: 12px 12px 4px 12px;
  border-left: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
`;
