import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAssistiveListeningSystems, faAsterisk, faBeer, faBottleWater, faCoffee, faGlassMartini, faGlassWater, faIceCream, faPizzaSlice } from '@fortawesome/free-solid-svg-icons';

const keywords = [
  { words: ['cafe', 'café', 'coffee', 'cafes'], icon: faCoffee },
  { words: ['pizza'], icon: faPizzaSlice },
  { words: ['cerveza'], icon: faBeer},
  { words: ['jugo', 'jugos'], icon: faGlassWater},
  { words: ['refresco', 'refrescos'], icon: faBottleWater},
  { words: ['helado', 'helados'], icon: faIceCream },
  { words: ['general'], icon: faAsterisk}
];

const getIconFromText = (text) => {
  for (const keyword of keywords) {
    if (new RegExp(`\\b(${keyword.words.join('|')})\\b`).test(text.toLowerCase())) {
      return <FontAwesomeIcon icon={keyword.icon}/> ;
    }
  }
  return null;
};

export default getIconFromText;
