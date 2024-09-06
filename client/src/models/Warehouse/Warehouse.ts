export interface Warehouse {
    id: string; // auto-generated
    name: string;
    description: string;
    shortName: string;
    number: number;
    owner: string;
    location: string;
    address: string;
    dimension: {
      length: number;
      width: number;
      height: number;
    };
    capacity: number;
    businessId: string;
  }
  