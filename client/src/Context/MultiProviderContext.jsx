
// Importa otros proveedores aquí

import ThemeColorProvider from "../theme/ThemeProvider";
import { DialogProvider } from "./Dialog/DialogContext";

const MultiProvider = ({ children }) => {
    return (
        <ThemeColorProvider>
            <DialogProvider>
                {children}
            </DialogProvider>
        </ThemeColorProvider>
    );
};

export default MultiProvider;