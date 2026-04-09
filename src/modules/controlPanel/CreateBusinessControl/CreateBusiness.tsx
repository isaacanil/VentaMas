import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

import { fbGetBusinesses } from '@/firebase/dev/businesses/fbGetBusinesses';

interface BusinessInfo {
  id?: string;
  name?: string;
}

interface BusinessDoc {
  business?: BusinessInfo;
}

export const CreateBusiness: React.FC = () => {
  const [businesses, setBusinesses] = useState<BusinessDoc[]>([]);
  useEffect(() => {
    const unsubscribe = fbGetBusinesses(setBusinesses);
    return () => {
      unsubscribe();
    };
  }, []);
  return (
    <Container>
      <Head>
        <h1>Create Business</h1>
      </Head>
      <Body>
        {businesses.map(({ business }, index) => {
          if (!business) {
            return null;
          }

          return (
            <div key={business.id ?? business.name ?? index}>
              {business.name}
            </div>
          );
        })}
      </Body>
    </Container>
  );
};
const Container = styled.div``;
const Head = styled.div``;
const Body = styled.div``;
