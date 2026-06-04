import { useEffect, useState } from 'react';

import {
  subscribeToChangelogList,
  type ChangelogListItem,
} from '../repositories/changelogList.repository';

export const useChangelogList = () => {
  const [changelogs, setChangelogs] = useState<ChangelogListItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      return subscribeToChangelogList({
        onChange: setChangelogs,
        onError: setError,
      });
    } catch (err) {
      console.error('Error al inicializar changelogs:', err);
      return undefined;
    }
  }, []);

  return { changelogs, error };
};
