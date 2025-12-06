import React from 'react';
import styled from 'styled-components';

import { icons } from '../../../../../constants/icons/icons';
import { Button } from '../../../../templates/system/Button/Button';
import Typography from '../../../../templates/system/Typografy/Typografy';

/**
 *
 *
 * @param {*} {title = "Settings"}
 * @return {*}
 */
export const Header = ({ config }) => {
  const { title = 'Settings' } = config;
  return (
    <Container>
      <Typography variant={'h2'} disableMargins>
        {title}
      </Typography>
      <Button
        title={icons.operationModes.close}
        width="icon16"
        borderRadius="round"
        bgcolor="neutro"
      />
    </Container>
  );
};
const Container = styled.div`
  display: grid;
  grid-template-columns: 1fr min-content;
  align-items: center;
  height: 2.6em;
  padding: 0 1em;
  border-bottom: ${(props) => props.theme.border.base};
`;
