import { Platform } from 'react-native';

// Lazily require only the selected implementation to avoid bundling both
let MapImpl: any;
if (Platform.OS === 'web') {
  MapImpl = require('./Map.web').default;
} else {
  MapImpl = require('./Map.native').default;
}

export default MapImpl as any;
