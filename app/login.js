// =============================================
// SHERIFF GAMES - GİRİŞ YAP SAYFASI
// =============================================

import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const API_URL = 'http://localhost:3001';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();

      if (data.status === 'Success') {
        // KULLANICIYI TELEFONUN HAFIZASINA KAYDET
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        
        Alert.alert('Başarılı', `Hoş geldin, ${data.user.userName}!`);
        router.replace('/'); // Ana sayfaya yönlendir
      } else {
        Alert.alert('Hata', data.message || 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Text style={styles.mainTitle}>ŞERİF OYUNLARI</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Giriş Yap</Text>
          <View style={styles.divider} />

          <Text style={styles.label}>Kullanıcı Adı veya E-posta</Text>
          <TextInput
            style={styles.input}
            placeholder="E-posta veya kullanıcı adı"
            placeholderTextColor={COLORS.mutedText}
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="Şifreniz"
            placeholderTextColor={COLORS.mutedText}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.loginButtonText}>GİRİŞ YAP</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.forgotPasswordContainer}>
            <Text style={styles.forgotPasswordText}>Şifremi Unuttum</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Hesabın yok mu? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={styles.footerLink}>Şimdi Kaydol!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  mainTitle: { color: COLORS.accentColor, fontSize: FONTS.sizes.title, fontWeight: 'bold', marginBottom: 40, letterSpacing: 2 },
  card: { backgroundColor: COLORS.cardBg, width: '100%', maxWidth: 400, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: '#333' },
  cardTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: 'bold', textAlign: 'center', marginBottom: SPACING.md },
  divider: { height: 2, backgroundColor: COLORS.accentColor, width: '40%', alignSelf: 'center', marginBottom: SPACING.xl },
  label: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: 'bold', marginBottom: SPACING.sm },
  input: { backgroundColor: '#2a2a35', color: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.sm, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#444' },
  loginButton: { backgroundColor: COLORS.accentColor, padding: SPACING.md, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.sm },
  loginButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md, letterSpacing: 1 },
  forgotPasswordContainer: { alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.md },
  forgotPasswordText: { color: '#6c63ff', fontSize: FONTS.sizes.sm },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.md },
  footerText: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm },
  footerLink: { color: COLORS.accentColor, fontSize: FONTS.sizes.sm, fontWeight: 'bold' }
});