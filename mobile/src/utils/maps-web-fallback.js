import { Platform } from 'react-native';

// Web fallback for react-native-maps
if (Platform.OS === 'web') {
  // Export empty components for web
  module.exports = {
    default: () => null,
    MapView: () => null,
    Marker: () => null,
    Polyline: () => null,
    PROVIDER_GOOGLE: 'google',
  };
} else {
  // Use actual react-native-maps for native platforms
  module.exports = require('react-native-maps');
}
