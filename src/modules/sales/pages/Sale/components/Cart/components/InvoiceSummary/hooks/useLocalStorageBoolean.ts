import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export function useLocalStorageBoolean(
  key: string,
  defaultValue: boolean,
): readonly [boolean, Dispatch<SetStateAction<boolean>>] {
  const [value, setValue] = useState<boolean>(() => {
    try {
      if (typeof localStorage === 'undefined') return defaultValue;
      const raw = localStorage.getItem(key);
      if (raw == null) return defaultValue;
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'boolean' ? parsed : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      if (typeof localStorage === 'undefined') return;
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Best-effort persistence; ignore quota/security errors.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
