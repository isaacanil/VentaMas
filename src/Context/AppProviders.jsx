// Importa otros proveedores aquí

import ThemeColorProvider from '../theme/ThemeProvider';

import { AbilityProvider } from './AbilityContext/AbilityProvider';
import { CategoryProvider } from './CategoryContext';
import { DialogProvider } from './Dialog';

const providers = [
  ThemeColorProvider,
  CategoryProvider,
  DialogProvider,
  AbilityProvider,
];

const AppProviders = ({ children }) => {
  return providers.reduce(
    (prev, Provider) => <Provider>{prev}</Provider>,
    children,
  );
};

export default AppProviders;
