
import React from 'react';
import { Form } from 'antd';
import styled from 'styled-components';
import InvoiceTemplates from '../../../Invoice/components/InvoiceTemplates/InvoiceTemplates';
import DueDateConfig from './DueDateConfig';

const ConfigItem = styled.div`
  padding-left: ${(props) => (props.level || 0) * 16}px;
  margin-bottom: 8px;
`;

const InvoiceSettingsSection = () => {
  return (
    <Form layout="vertical">
      <ConfigItem level={1}>
        <InvoiceTemplates previewInModal />
      </ConfigItem>
      <ConfigItem level={1}>
        <DueDateConfig />
      </ConfigItem>
    </Form>
  );
};

export default InvoiceSettingsSection;