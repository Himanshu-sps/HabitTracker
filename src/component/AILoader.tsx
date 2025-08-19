import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { useAppTheme } from '@/utils/ThemeContext';
import AppSpacer from './AppSpacer';

const AILoader = () => {
  const { colors } = useAppTheme();
  const style = getStyles(colors);

  return (
    <View style={style.container}>
      <ActivityIndicator color={'white'} size={24} />
      <AppSpacer horizontal={10} />
      <Text style={style.text}>Ai is processing ...</Text>
    </View>
  );
};

export default AILoader;

function getStyles(colors: any) {
  return StyleSheet.create({
    container: {
      width: 'auto',
      flexDirection: 'row',
      height: 'auto',
      borderRadius: 25,
      padding: 10,
      backgroundColor: colors.habitBlue,
      alignSelf: 'center',
      alignItems: 'center',
    },
    text: {
      color: 'white',
      fontWeight: 'bold',
      fontSize: 18,
    },
  });
}
