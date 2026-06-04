import { AutoComplete, Input } from 'antd';
import type { BaseOptionType } from 'antd/es/select';
import { useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';

import { icons } from '@/constants/icons/icons';

import type { SettingItem } from '../../SettingData';
import {
  buildSettingSearchTokens,
  getSettingItemKey,
  matchesSettingSearchOption,
} from '../../utils/settingSearch';
import {
  SearchInner,
  SearchOption,
  SearchOptionDescription,
  SearchOptionMeta,
  SearchOptionTitle,
  SearchWrapper,
} from './SettingSearch.styles';

interface SettingSearchOption extends BaseOptionType {
  value: string;
  label: ReactNode;
  searchTokens: string[];
}

type SettingSearchProps = {
  items: SettingItem[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
};

export const SettingSearch = ({
  items,
  value,
  onChange,
  onSelect,
}: SettingSearchProps) => {
  const searchOptions = useMemo<SettingSearchOption[]>(() => {
    return items.map((item) => ({
      value: getSettingItemKey(item),
      label: (
        <SearchOption>
          <SearchOptionTitle>{item.title}</SearchOptionTitle>
          <SearchOptionMeta>{item.category}</SearchOptionMeta>
          <SearchOptionDescription>{item.description}</SearchOptionDescription>
        </SearchOption>
      ),
      searchTokens: buildSettingSearchTokens(item),
    }));
  }, [items]);

  const filterOption = useCallback(
    (inputValue: string, option?: SettingSearchOption) =>
      matchesSettingSearchOption(inputValue, option),
    [],
  );

  return (
    <SearchWrapper>
      <SearchInner>
        <AutoComplete
          options={searchOptions}
          value={value}
          onChange={onChange}
          onSelect={onSelect}
          filterOption={filterOption}
          placeholder="Buscar en configuración..."
          popupMatchSelectWidth={400}
        >
          <Input
            size="large"
            placeholder="Buscar en configuración..."
            allowClear
            prefix={icons.operationModes.search}
          />
        </AutoComplete>
      </SearchInner>
    </SearchWrapper>
  );
};
