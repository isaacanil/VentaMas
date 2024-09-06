export interface Segment {
    id: string; // auto-generated
    name: string;
    description: string;
    shortName: string;
    rowShelfId: string; // Reference to the RowShelf
    capacity: number;
  }
  