// babel.config.js
module.exports = function (api) {
  api.cache(true);
  return {
    // 👉 Đưa expo-router vào PRESETS (kèm preset Expo + option cho NativeWind)
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'expo-router/babel',
    ],
    // 👉 Các plugin
    plugins: [
      'nativewind/babel',
      'react-native-worklets-core/plugin',
      'react-native-reanimated/plugin', // phải đứng cuối
    ],
  };
};
