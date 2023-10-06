import { InputV4 } from "../../../../../templates/system/Inputs/GeneralInput/InputV4";
import { Section } from "../ProductForm";

export const ProductInfo = ({ onChange }) => (
    <Section>
        <label>Nombre del Producto:</label>
        <InputV4 type="text" name="productName" onChange={onChange} />
        
        {/* ...other fields */}
    </Section>
);