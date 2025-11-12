import React from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { SelectSettingCart } from '../../../../../features/cart/cartSlice';
import { QuotationTemplate2 } from '../../templates/Invoicing/QuotationTemplate2/QuotationTemplate2';

const InvoiceWrapper = styled.div`
  ${props => props.template === 'template2' && `
    font-size: 12px;
    
    table {
      font-size: 10px;
    }
    
    h1, h2, h3 {
      font-size: 14px;
    }
  `}
  
  ${props => props.template === 'template1' && `
    font-size: 14px;
    
    table {
      font-size: 12px;
    }
  `}
`;

export const Quotation = React.forwardRef(({ data, template = "template2", ignoreHidden }, ref) => {
  // Remove unused selections to satisfy lint
  // const { billing: { billingMode, invoiceType } } = useSelector(SelectSettingCart);
  useSelector(SelectSettingCart);
    const renderTemplate = () => {
        switch ('template2') {
            case 'template1':
                // return <InvoiceTemplate1 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
                return <QuotationTemplate2 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
            case 'template2':
                return <QuotationTemplate2 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
            default:
                return <QuotationTemplate2 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
        }
    };

    return (
        <InvoiceWrapper template={template}>
            {renderTemplate()}
        </InvoiceWrapper>
    );
});

Quotation.displayName = 'Quotation';
