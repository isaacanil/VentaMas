// @ts-nocheck
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { selectBusinessData } from '@/features/auth/businessSlice';

import Content from './components/Content';
import Footer from './components/Footer';
import Header from './components/Header';
import { calcFooterHeight, calcHeaderHeight } from './documentHeightCalculator';

const Container = styled.div`
  position: relative;
  width: 100%;
  padding: 16px;
  margin: 0;

  @media print {
    padding: 0;
  }
`;

const PrintLayout = styled.div`
  & table {
    width: 100% !important;
  }

  @media print {
    thead {
      display: table-header-group;
    }

    tfoot {
      display: table-footer-group;
    }

    /* la tabla interna de Content: */
    > tbody > tr > td > table {
      display: table-row-group !important;
    }
  }
`;

const HeaderSpace = styled.div`
  @media print {
    height: ${({ $height }) => $height}px;
  }
`;

const FooterSpace = styled.div`
  @media print {
    height: ${({ $height }) => $height}px;
  }
`;

const FixedHeader = styled.div`
  padding: 16px;
  margin-bottom: 16px;

  @media print {
    position: fixed;
    top: 0;
    right: 0;
    left: 0;
    z-index: 10000;
  }
`;

const FixedFooter = styled.div`
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 10000;
  padding: 16px;

  @media print {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
  }
`;

export const QuotationTemplate2 = React.forwardRef(
  ({ data, ignoreHidden }, ref) => {
    const businessData = useSelector(selectBusinessData);
    const business = useMemo(() => businessData || {}, [businessData]);
    const [headerHeight, setHeaderHeight] = useState(() => calcHeaderHeight(business, data));
    const [footerHeight, setFooterHeight] = useState(() => calcFooterHeight(data));

    useLayoutEffect(() => {
      // Usar requestAnimationFrame para evitar renderizado síncrono
      requestAnimationFrame(() => {
        setHeaderHeight(calcHeaderHeight(business, data));
        setFooterHeight(calcFooterHeight(data));
      });
    }, [business, data]);

    if (!data) return null;

    return (
      <Container style={{ display: ignoreHidden ? 'block' : 'none' }}>
        <PrintLayout ref={ref}>
          <FixedHeader>
            <Header business={business} data={data} />
          </FixedHeader>
          <thead>
            <tr>
              <td>
                <HeaderSpace $height={headerHeight} />
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
                <FooterSpace $height={footerHeight} />
              </td>
            </tr>
          </tfoot>
          <FixedFooter>
            <Footer business={business} data={data} />
          </FixedFooter>
        </PrintLayout>
      </Container>
    );
  },
);

QuotationTemplate2.displayName = 'QuotationTemplate2';
