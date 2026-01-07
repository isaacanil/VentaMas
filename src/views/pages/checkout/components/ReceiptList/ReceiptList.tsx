// @ts-nocheck
import React from 'react';
import styled from 'styled-components';

import { Paragraph } from '@/views/pages/checkout/Style';

export function ReceiptList({ title, list = [], formatReceipt }) {
  return (
    <Group>
      <Paragraph>{title}</Paragraph>
      <ul>
        {list.map((item, idx) => (
          <li key={idx}>{formatReceipt(item)}</li>
        ))}
      </ul>
    </Group>
  );
}

const Group = styled.div``;
