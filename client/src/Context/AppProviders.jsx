
// Importa otros proveedores aquí

import ThemeColorProvider from "../theme/ThemeProvider";
import { CategoryProvider } from "./CategoryContext/CategoryContext";
import { DialogProvider } from "./Dialog/DialogContext";

const providers = [
    ThemeColorProvider,
    CategoryProvider,
    DialogProvider,
]

const AppProviders = ({ children }) => {
    return providers.reduce((prev, Provider) => <Provider>{prev}</Provider>, children);
};  

export default AppProviders;