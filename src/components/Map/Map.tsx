import { Platform } from 'react-native';

// Dynamically require the platform-specific implementation
// to help TypeScript resolve the module in a cross-platform way.
// On web -> Map.web.tsx, on native -> Map.native.tsx
// eslint-disable-next-line @typescript-eslint/no-var-requires
const Map = Platform.select({
  web: require('./Map.web').default,
  default: require('./Map.native').default
});

export default Map as any;
