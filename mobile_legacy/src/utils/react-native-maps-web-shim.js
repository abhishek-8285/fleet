// Web shim for react-native-maps
// This provides dummy exports for web platform to avoid native import errors

import { Platform } from 'react-native';

let MapView, Marker, Polyline, PROVIDER_GOOGLE;

if (Platform.OS !== 'web') {
  // Use actual react-native-maps on native platforms
  const maps = require('react-native-maps/index');
  MapView = maps.default;
  Marker = maps.Marker;
  Polyline = maps.Polyline;
  PROVIDER_GOOGLE = maps.PROVIDER_GOOGLE;
} else {
  // Provide dummy components for web
  MapView = () => null;
  Marker = () => null;
  Polyline = () => null;
  PROVIDER_GOOGLE = 'google';
}

export default MapView;
export { Marker, Polyline, PROVIDER_GOOGLE };
