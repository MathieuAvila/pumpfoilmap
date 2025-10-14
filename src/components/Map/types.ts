export type HeatPoint = {
  lon: number;
  lat: number;
  weight?: number;
  title?: string;
  description?: string;
  type?: 'ponton' | 'association';
  url?: string;
  address?: string;
  submittedBy?: string;
  createdAt?: string;
  heightM?: number;
  lengthM?: number;
  access?: 'autorise' | 'tolere';
  imageUrl?: string; // external image displayed in popup
  // allow arbitrary extra properties for future metadata
  [key: string]: any;
};

export type MapProps = {
  points: HeatPoint[];
};
