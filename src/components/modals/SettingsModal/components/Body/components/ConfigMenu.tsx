import React from 'react';
import styled from 'styled-components';

interface ConfigMenuProps {
  items?: Array<Record<string, unknown>>;
}

export const ConfigMenu = ({ items: _items }: ConfigMenuProps) => {
  return <Container></Container>;
};

const Container = styled.div``;
