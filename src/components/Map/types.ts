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
  // Optional: if provided, map will expose a picking mode to select coordinates
  onPickLocation?: (coords: { lat: number; lon: number }) => void;
  picking?: boolean; // when true, clicks tap into selection instead of normal popup
};
