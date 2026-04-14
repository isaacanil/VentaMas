import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SelectSettingCart } from '@/features/cart/cartSlice';
import { InvoiceTemplate1 } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { InvoiceTemplate2 } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2/InvoiceTemplate2';
import { InvoiceTemplate2V3 } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V3/InvoiceTemplate2V3';
import { InvoiceTemplate2V31 } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate2V31';
import { InvoiceTemplate3 } from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate3/InvoiceTemplate3';
import InvoiceTemplate4 from '@/modules/invoice/components/Invoice/templates/Invoicing/InvoiceTemplate4/InvoiceTemplate4';
import type { InvoiceData, InvoiceSignatureAssets } from '@/types/invoice';
import {
  resolveInvoiceSelectionTemplate,
} from '@/utils/invoice/template';

const InvoiceWrapper = styled.div<{ $template: string }>`
  ${({ $template }) =>
    ($template === 'template2' ||
      $template === 'template2_v2' ||
      $template === 'template2_v3' ||
      $template === 'template2_v3_1') &&
    `
    font-size: 12px;
    
    table {
      font-size: 10px;
    }
    
    h1, h2, h3 {
      font-size: 14px;
    }
  `}

  ${({ $template }) =>
    $template === 'template1' &&
    `
    font-size: 14px;
    
    table {
      font-size: 12px;
    }
  `}
`;

export const Invoice = React.forwardRef(
  (
    {
      data,
      template = 'template1',
      ignoreHidden,
      previewSignatureAssets,
    }: {
      data?: InvoiceData | null;
      template?: string;
      ignoreHidden?: boolean;
      previewSignatureAssets?: InvoiceSignatureAssets;
    },
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const {
      billing: { invoiceType },
    } = useSelector(SelectSettingCart);
    const selectedTemplate = resolveInvoiceSelectionTemplate(
      template || invoiceType,
    );
    let templateContent;
    switch (selectedTemplate) {
      case 'template2_v3':
        templateContent = (
          <InvoiceTemplate2V3
            ref={ref}
            data={data}
            ignoreHidden={ignoreHidden}
            previewSignatureAssets={previewSignatureAssets}
          />
        );
        break;
      case 'template2_v3_1':
        templateContent = (
          <InvoiceTemplate2V31
            ref={ref}
            data={data}
            ignoreHidden={ignoreHidden}
            previewSignatureAssets={previewSignatureAssets}
          />
        );
        break;
      case 'template2_v2':
      case 'template2':
        templateContent = (
          <InvoiceTemplate2 ref={ref} data={data} ignoreHidden={ignoreHidden} />
        );
        break;
      case 'template3':
        templateContent = (
          <InvoiceTemplate3 ref={ref} data={data} ignoreHidden={ignoreHidden} />
        );
        break;
      case 'template4':
        templateContent = (
          <InvoiceTemplate4 ref={ref} data={data} ignoreHidden={ignoreHidden} />
        );
        break;
      case 'template1':
      default:
        templateContent = (
          <InvoiceTemplate1 ref={ref} data={data} ignoreHidden={ignoreHidden} />
        );
        break;
    }

    return (
      <InvoiceWrapper $template={selectedTemplate}>
        {templateContent}
      </InvoiceWrapper>
    );
  },
);

Invoice.displayName = 'Invoice';
