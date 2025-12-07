const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add resolver to handle platform-specific modules
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Configure platform-specific extensions
config.resolver.sourceExts.push('web.js', 'web.ts', 'web.tsx');

// Add platform-specific module resolution
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

// Handle react-native-maps web compatibility
if (process.env.EXPO_PLATFORM === 'web') {
  config.resolver.alias = {
    'react-native-maps': require.resolve('./src/utils/maps-web-fallback.js'),
  };
}

module.exports = config;