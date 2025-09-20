import 'react-native-gesture-handler/jestSetup';

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const Reanimated = require('react-native-reanimated/mock');
  Reanimated.default.call = () => {};
  return Reanimated;
});

// Mock expo modules
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}));

// Mock react-native modules
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Silence the warning: Animated: `useNativeDriver` was not specified.
jest.mock('react-native/Libraries/Animated/AnimatedImplementation', () => {
  const ActualAnimated = jest.requireActual('react-native/Libraries/Animated/AnimatedImplementation');
  return {
    ...ActualAnimated,
    timing: (value, config) => {
      return {
        start: jest.fn(),
        stop: jest.fn(),
        reset: jest.fn(),
      };
    },
  };
});
