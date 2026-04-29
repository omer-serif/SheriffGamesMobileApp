import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { COLORS } from '../constants/theme';

export default function RootLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bgColor }}>
      {/* Tüm uygulama genelinde saat/şarj göstergelerini beyaz yapar */}
      <StatusBar style="light" />
      
      {/* Sayfaların yönetim sistemi */}
      <Stack
        screenOptions={{
          headerShown: false, // Expo'nun varsayılan beyaz başlığını gizler
          contentStyle: { backgroundColor: COLORS.bgColor }, // En arka planı koyu yapar
        }}
      />
    </View>
  );
}