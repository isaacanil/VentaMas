import { Fragment, useMemo } from 'react';

import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { Container, Wrapper } from './ChangelogList.styles';
import { ChangelogListItem } from './components/ChangelogListItem';
import { useChangelogList } from './hooks/useChangelogList';

export const ChangelogList = () => {
  const { changelogs, error } = useChangelogList();
  const sortedChangelogItems = useMemo(
    () =>
      [...changelogs].sort((a, b) => {
        const aDate = a?.changelog?.createdAt ?? new Date(0);
        const bDate = b?.changelog?.createdAt ?? new Date(0);
        return bDate.getTime() - aDate.getTime();
      }),
    [changelogs],
  );

  if (error) {
    return (
      <Container>
        <Wrapper>
          <h1>Ventamax — Notas del lanzamiento</h1>
          <p>
            No se pudieron cargar las notas de la versión. Intenta nuevamente.
          </p>
        </Wrapper>
      </Container>
    );
  }

  return (
    <Fragment>
      <MenuApp />
      <Container>
        <Wrapper>
          <h1>Ventamax — Notas del lanzamiento</h1>
          <br />
          {sortedChangelogItems.map(({ changelog }, index) => (
            <ChangelogListItem
              key={changelog?.id ?? index}
              content={changelog.content}
            />
          ))}
        </Wrapper>
      </Container>
    </Fragment>
  );
};
