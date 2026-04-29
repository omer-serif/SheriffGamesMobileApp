import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const API_URL = 'http://localhost:3001';

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Hata', 'Şifreler birbiriyle eşleşmiyor.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      const data = await response.json();

      if (data.status === 'Success') {
        Alert.alert('Başarılı', 'Hesabın oluşturuldu! Şimdi giriş yapabilirsin.');
        router.back(); // Giriş ekranına geri dön
      } else {
        Alert.alert('Hata', 'Kayıt olurken bir sorun oluştu.');
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          
          <Text style={styles.mainTitle}>ŞERİF OYUNLARI</Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Hemen Kaydol</Text>
            <View style={styles.divider} />

            <Text style={styles.label}>Kullanıcı Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="Oyunlarda oynadınız"
              placeholderTextColor={COLORS.mutedText}
              autoCapitalize="none"
              value={username}
              onChangeText={setUsername}
            />

            <Text style={styles.label}>E-posta</Text>
            <TextInput
              style={styles.input}
              placeholder="Bir e-posta adresi"
              placeholderTextColor={COLORS.mutedText}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Şifre</Text>
            <TextInput
              style={styles.input}
              placeholder="Güçlü bir parola"
              placeholderTextColor={COLORS.mutedText}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Şifreler (Tekrar)</Text>
            <TextInput
              style={styles.input}
              placeholder="Şifrenizi tekrar girin"
              placeholderTextColor={COLORS.mutedText}
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {/* KAYIT BUTONU (MOR) */}
            <TouchableOpacity 
              style={styles.registerButton} 
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.registerButtonText}>HESAP OLUŞTUR</Text>
              )}
            </TouchableOpacity>

            {/* GİRİŞ YAP LİNKİ */}
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>Zaten bir hesabın var mı? </Text>
              <TouchableOpacity onPress={() => router.back()}>
                <Text style={styles.footerLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.xl, paddingVertical: 40 },
  mainTitle: { color: COLORS.accentColor, fontSize: FONTS.sizes.title, fontWeight: 'bold', marginBottom: 30, letterSpacing: 2 },
  card: { backgroundColor: COLORS.cardBg, width: '100%', maxWidth: 400, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: '#333' },
  cardTitle: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: 'bold', textAlign: 'center', marginBottom: SPACING.md },
  divider: { height: 2, backgroundColor: COLORS.accentColor, width: '40%', alignSelf: 'center', marginBottom: SPACING.xl },
  label: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: 'bold', marginBottom: SPACING.sm },
  input: { backgroundColor: '#2a2a35', color: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.sm, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#444' },
  registerButton: { backgroundColor: COLORS.secondaryAccent, padding: SPACING.md, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.md },
  registerButtonText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md, letterSpacing: 1 },
  footerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: SPACING.xl },
  footerText: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm },
  footerLink: { color: COLORS.accentColor, fontSize: FONTS.sizes.sm, fontWeight: 'bold' }
});