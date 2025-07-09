module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      'react-native-reanimated/plugin',
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@navigation': './src/navigation',
            '@utils': './src/utils',
            '@screens': './src/screens',
            '@redux': './src/redux',
            '@types': './src/types',
          },
        },
      ],
    ],
  };
};
