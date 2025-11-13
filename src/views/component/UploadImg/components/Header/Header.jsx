import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { Button } from '../../../../templates/system/Button/Button';

export const Header = ({ setIsOpen }) => {
  return (
    <Head>
      {' '}
      <Button
        borderRadius="normal"
        startIcon={<FontAwesomeIcon icon={faArrowLeft} />}
        title="atrás"
        onClick={() => setIsOpen(false)}
      />
    </Head>
  );
};

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 2.75em;
`;
