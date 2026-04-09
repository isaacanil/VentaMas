export interface OrderMenuOption {
  name: string;
  selected?: boolean;
  [key: string]: unknown;
}

export interface OrderMenuItem {
  name: string;
  Items: OrderMenuOption[];
  [key: string]: unknown;
}

