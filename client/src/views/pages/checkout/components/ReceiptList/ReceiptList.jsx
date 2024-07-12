import React from 'react';
import { Paragraph } from '../../Style';
import styled from 'styled-components';


export function ReceiptList({ title, list = [], formatReceipt }) {
    return (
        <Group>
            <Paragraph>{title}</Paragraph>
            <ul>
                {list.map((item, idx) => (
                    <li key={idx}>
                        {formatReceipt(item)}
                    </li>
                ))}
            </ul>
        </Group>
    );
}

const Group = styled.div`

`