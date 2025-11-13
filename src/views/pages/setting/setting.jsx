import { AutoComplete, Input } from 'antd';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import styled from 'styled-components';

import { icons } from '../../../constants/icons/icons';
import { MenuApp } from '../../templates/MenuApp/MenuApp';
import { Transition } from '../../templates/system/Transition';
import Typography from '../../templates/system/Typografy/Typografy';

import { Card } from './Components/Card';
import { getSettingData } from './SettingData';

const normalizeText = (value = '') =>
  value
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

export const Setting = () => {
  const [searchValue, setSearchValue] = useState('');
  const cardRefs = useRef({});
  const highlightTimersRef = useRef({});

  const settingData = useMemo(() => getSettingData(), []);

  const groupedSettings = useMemo(() => {
    return settingData.reduce((acc, item) => {
      if (acc[item.category]) {
        acc[item.category].push(item);
      } else {
        acc[item.category] = [item];
      }
      return acc;
    }, {});
  }, [settingData]);

  const searchOptions = useMemo(() => {
    return settingData.map((item) => {
      const value = item.route || item.title;
      const normalizedTokens = [
        normalizeText(item.title),
        normalizeText(item.description),
        normalizeText(item.category),
      ].filter(Boolean);

      return {
        value,
        label: (
          <SearchOption>
            <SearchOptionTitle>{item.title}</SearchOptionTitle>
            <SearchOptionMeta>{item.category}</SearchOptionMeta>
            <SearchOptionDescription>
              {item.description}
            </SearchOptionDescription>
          </SearchOption>
        ),
        searchTokens: normalizedTokens,
      };
    });
  }, [settingData]);

  const filterOption = useCallback((inputValue, option) => {
    if (!inputValue) return true;
    const normalizedValue = normalizeText(inputValue);
    if (!normalizedValue) return true;
    return option?.searchTokens?.some((token) =>
      token.includes(normalizedValue),
    );
  }, []);

  const scrollToCard = useCallback((route) => {
    const target = cardRefs.current[route];
    if (!target) return;

    target.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });

    if (typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }

    target.classList.add('search-highlight');

    if (highlightTimersRef.current[route]) {
      clearTimeout(highlightTimersRef.current[route]);
    }

    highlightTimersRef.current[route] = setTimeout(() => {
      target.classList.remove('search-highlight');
      delete highlightTimersRef.current[route];
    }, 1800);
  }, []);

  const handleSelect = useCallback(
    (value) => {
      if (!value) return;
      scrollToCard(value);
      setSearchValue('');
    },
    [scrollToCard],
  );

  const handleChange = useCallback((value) => {
    setSearchValue(value);
  }, []);

  useEffect(() => {
    return () => {
      Object.values(highlightTimersRef.current).forEach((timerId) => {
        clearTimeout(timerId);
      });
      highlightTimersRef.current = {};
    };
  }, []);

  return (
    <Transition>
      <Container>
        <MenuApp sectionName={'Configuración'} />
        <Body>
          <SearchWrapper>
            <SearchInner>
              <AutoComplete
                options={searchOptions}
                value={searchValue}
                onChange={handleChange}
                onSelect={handleSelect}
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
          <Categories>
            {Object.keys(groupedSettings).map((category, index) => (
              <CategoryContainer key={index}>
                <Typography variant="h3">{category}</Typography>
                <Cards>
                  {groupedSettings[category].map((item, index) => (
                    <Card
                      data={item}
                      key={item.route || `${item.title}-${index}`}
                      ref={(node) => {
                        if (node) {
                          cardRefs.current[item.route || item.title] = node;
                        } else {
                          delete cardRefs.current[item.route || item.title];
                        }
                      }}
                      data-setting-id={item.route || item.title}
                    />
                  ))}
                </Cards>
              </CategoryContainer>
            ))}
          </Categories>
        </Body>
      </Container>
    </Transition>
  );
};

const Container = styled.div`
  display: grid;
  grid-template-rows: min-content 1fr;
  gap: 0.5em;
  width: 100%;
  height: 100%;
`;
const Body = styled.div`
  width: 100%;
  background-color: #fff;
  border-radius: var(--border-radius);
`;
const SearchWrapper = styled.div`
  padding: 1.5em 1em 0;
`;

const SearchInner = styled.div`
  width: 100%;
  max-width: 640px;
  margin: 0 auto;

  .ant-input-affix-wrapper {
    border-radius: 999px;
  }
`;

const Categories = styled.div`
  display: grid;
  gap: 1em;
  padding: 1em;
`;
const CategoryContainer = styled.div`
  width: 100%;
  max-width: 1000px;
  padding: 10px;
  margin: 0 auto;
  background-color: var(--color2);
  border-radius: var(--border-radius);
`;
const Cards = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1em;
  width: 100%;
  padding: 10px 0 0;
  margin: 0 auto;
`;

const SearchOption = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const SearchOptionTitle = styled.span`
  font-weight: 600;
  color: rgb(0 0 0 / 88%);
`;

const SearchOptionMeta = styled.span`
  font-size: 0.75rem;
  color: rgb(0 0 0 / 45%);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const SearchOptionDescription = styled.span`
  font-size: 0.85rem;
  line-height: 1.3;
  color: rgb(0 0 0 / 65%);
`;
