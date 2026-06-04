import { useCallback, useMemo, useState } from 'react';

import { Transition } from '@/components/ui/Transition';
import { MenuApp } from '@/modules/navigation/components/MenuApp/MenuApp';

import { SettingCategorySection } from './components/SettingCategorySection/SettingCategorySection';
import { SettingSearch } from './components/SettingSearch/SettingSearch';
import { useSettingCardHighlight } from './hooks/useSettingCardHighlight';
import { getSettingData } from './SettingData';
import type { SettingItem } from './SettingData';
import { Body, Categories, Container } from './Setting.styles';
import { groupSettingItemsByCategory } from './utils/settingSearch';

export const Setting = () => {
  const [searchValue, setSearchValue] = useState('');
  const { registerCard, scrollToCard } = useSettingCardHighlight();

  const settingData = useMemo<SettingItem[]>(() => getSettingData(), []);
  const groupedSettings = useMemo(
    () => groupSettingItemsByCategory(settingData),
    [settingData],
  );

  const handleSelect = useCallback(
    (value: string) => {
      if (!value) return;
      scrollToCard(value);
      setSearchValue('');
    },
    [scrollToCard],
  );

  const handleChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  return (
    <Transition>
      <Container>
        <MenuApp sectionName="Configuración" />
        <Body>
          <SettingSearch
            items={settingData}
            value={searchValue}
            onChange={handleChange}
            onSelect={handleSelect}
          />
          <Categories>
            {Object.entries(groupedSettings).map(([category, items]) => (
              <SettingCategorySection
                key={category}
                category={category}
                items={items}
                registerCard={registerCard}
              />
            ))}
          </Categories>
        </Body>
      </Container>
    </Transition>
  );
};
