import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgColor }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false, 
          contentStyle: { backgroundColor: COLORS.bgColor },    
        }}
      />
    </View>
  );
}