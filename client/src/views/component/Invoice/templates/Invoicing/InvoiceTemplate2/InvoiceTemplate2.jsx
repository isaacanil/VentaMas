import React, { useRef } from 'react';
import styled from 'styled-components';
import { selectBusinessData } from '../../../../../../features/auth/businessSlice';
import { useSelector } from 'react-redux';
import Header from './components/Header';
import Content from './components/Content';
import Footer from './components/Footer';

const Container = styled.div`
position: relative;
  width: 100%;
  margin: 0;
  padding: 16px;

  @media print {
    padding: 0;
  }
`;

const PrintLayout = styled.table`
  width: 100%;
  height: 100%;

  border-collapse: collapse;
`;

const HeaderSpace = styled.div`
  @media print {
    height: 310px; // 250px
    
  }

`;

const FooterSpace = styled.div`
  height: 180px; // Adjust based on your footer height
`;

const FixedHeader = styled.div`

  padding: 16px;
  /* background: #ffffff; */
  
  @media print {
    z-index: 10000;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
  }
`;

const FixedFooter = styled.div`

  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px;
  /* background: #ffffff; */
  z-index: 10000;

  @media print {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
  }
`;

export const InvoiceTemplate2 = React.forwardRef(({ data, ignoreHidden }, ref) => {
  const business = useSelector(selectBusinessData) || {};

  return data ? (
    <Container style={{ display: ignoreHidden ? 'block' : 'none' }}>
      <PrintLayout ref={ref}>
        <FixedHeader>
          <Header business={business} data={data} />
        </FixedHeader>
        <thead>
          <tr>
            <td>
              <HeaderSpace />
            </td>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <Content data={data} />
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr>
            <td>
              <FooterSpace />
            </td>
          </tr>
        </tfoot>
        <FixedFooter>
          <Footer business={business} data={data} />
        </FixedFooter>
      </PrintLayout>
    </Container>
  ) : null;
});


