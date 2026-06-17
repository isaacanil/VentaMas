import Typography from '@/components/ui/Typography/Typography';

import { Card } from '../Card';
import type { SettingItem } from '../../SettingData';
import { getSettingItemKey } from '../../utils/settingSearch';
import { Cards, CategoryContainer } from './SettingCategorySection.styles';

type SettingCategorySectionProps = {
  category: string;
  items: SettingItem[];
  registerCard: (settingKey: string, node: HTMLAnchorElement | null) => void;
};

export const SettingCategorySection = ({
  category,
  items,
  registerCard,
}: SettingCategorySectionProps) => (
  <CategoryContainer>
    <Typography variant="h3">{category}</Typography>
    <Cards>
      {items.map((item) => {
        const settingKey = getSettingItemKey(item);

        return (
          <Card
            data={item}
            key={settingKey}
            ref={(node) => registerCard(settingKey, node)}
            data-setting-id={settingKey}
          />
        );
      })}
    </Cards>
  </CategoryContainer>
);
