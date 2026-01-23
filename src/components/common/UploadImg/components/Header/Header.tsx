import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import { Button } from '@/components/ui/Button/Button';

type HeaderProps = {
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

export const Header = ({ setIsOpen }: HeaderProps) => {
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
