import { useFormatPhoneNumber } from "../../../../../hooks/useFormatPhoneNumber";
import { InfoCard } from "../../../../templates/system/InfoCard/InfoCard";

export const ClientInfoCard = ({ client }) => {

    const formattedPhoneNumber = useFormatPhoneNumber(client.tel) ?? 'N/A';
  
    const elements = [
      { label: 'Nombre', value: client.name ?? 'N/A' },
      { label: 'Teléfono', value: formattedPhoneNumber },
      { label: 'Dirección', value: client.address ?? 'N/A' }
    ];
  
    return (
      <InfoCard title="Cliente" elements={elements} />
    );
  };
  
