import React from 'react';
import { InvoiceTemplate1 } from '../../templates/Invoicing/InvoiceTemplate1/InvoiceTemplate1';
import { InvoiceTemplate2 } from '../../templates/Invoicing/InvoiceTemplate2/InvoiceTemplate2';
import styled from 'styled-components';
import { useSelector } from 'react-redux';
import { SelectSettingCart } from '../../../../../features/cart/cartSlice';

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

export const Invoice = React.forwardRef(({ data, template = "template1", ignoreHidden }, ref) => {
  const { billing: { billingMode, invoiceType } } = useSelector(SelectSettingCart);
    const renderTemplate = () => {
        switch (invoiceType?.toLowerCase()) {
            case 'template1':
                return <InvoiceTemplate1 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
            case 'template2':
                return <InvoiceTemplate2 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
            default:
                return <InvoiceTemplate1 ref={ref} data={data} ignoreHidden={ignoreHidden} />;
        }
    };

    return (
        <InvoiceWrapper template={template}>
            {renderTemplate()}
        </InvoiceWrapper>
    );
});
