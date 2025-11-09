import styled from 'styled-components';

import { MenuWebsite } from '../../templates/MenuWebsite/MenuWebsite';

import { DashboardShortcuts } from './components/DashboardShortcuts/DashboardShortcuts';
import PersonalizedGreeting from './components/PersonalizedGreeting/PersonalizedGreeting';
import Footer from './Footer/Footer';

import type { JSX } from 'react';

export const Home = (): JSX.Element => {
  return (
    <HomeLayout>
      <MenuWebsite />
      <MainContent>
        <MainContentInner>
          <PersonalizedGreeting />
          <DashboardShortcuts />
        </MainContentInner>
      </MainContent>
      <Footer />
    </HomeLayout>
  );
};

const HomeLayout = styled.div`
  height: 100%;
  width: 100%;
  display: grid;
  grid-template-rows: min-content 1fr min-content;
  background-color: var(--color2);
`;

const MainContent = styled.main`
  display: grid;
  width: 100%;
  overflow-y: auto;

`;
const MainContentInner = styled.div`
  display: grid;
  align-items: start;
  align-content: start;
  margin: 0 auto;
  gap: 1em;
  max-width: 1200px;
  width: 100%;
  padding: 1em 1em;
  border-radius: var(--border-radius1);
`;
