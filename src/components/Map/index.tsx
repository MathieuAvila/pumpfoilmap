export type HeatPoint = { lon: number; lat: number; weight?: number };

export type MapProps = {
  points: HeatPoint[];
};

// Platform-specific implementations will be resolved by React Native bundler
// Map.native.tsx -> iOS/Android, Map.web.tsx -> Web
import Map from './Map';
export default Map;
