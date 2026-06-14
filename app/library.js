import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Alert, Modal, TextInput
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const API_URL = 'http://localhost:3001';

export default function LibraryScreen() {
  const [user, setUser] = useState(null);
  const [libraryData, setLibraryData] = useState({ games: [], assets: [] });
  const [activeTab, setActiveTab] = useState('games'); // 'games' veya 'assets'
  const [loading, setLoading] = useState(true);

  // Test Yükleme Modalı State'leri
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [selectedGameForTest, setSelectedGameForTest] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // YENİ: Açıklama ve Seçili Medya State'leri
  const [selectedMediaInfo, setSelectedMediaInfo] = useState(null); // { uri, filename, type, mediaType }
  const [testDescription, setTestDescription] = useState('');

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user');
      if (!userDataStr) { router.replace('/login'); return; }

      const currentUser = JSON.parse(userDataStr);
      setUser(currentUser);

      const res = await fetch(`${API_URL}/api/my-library/${currentUser.userID}`);
      const data = await res.json();
      setLibraryData(data);
    } catch (error) {
      console.error("Kütüphane yüklenemedi", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchLibrary(); }, []));

  const openTestModal = (game) => {
    setSelectedGameForTest(game);
    setSelectedMediaInfo(null); // Modalı açarken eski verileri temizle
    setTestDescription('');
    setTestModalVisible(true);
  };

  // 1. AŞAMA: Sadece Medyayı Seç
  const pickMedia = async (mediaType) => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: mediaType === 'video' ? ImagePicker.MediaTypeOptions.Videos : ImagePicker.MediaTypeOptions.Images,
      allowsEditing: mediaType === 'image',
      quality: 0.8,
    });

    if (!result.canceled) {
      const localUri = result.assets[0].uri;
      const filename = localUri.split('/').pop();

      let type = '';
      if (mediaType === 'video') {
        const match = /\.(\w+)$/.exec(filename);
        type = match ? `video/${match[1]}` : `video/mp4`;
      } else {
        const match = /\.(\w+)$/.exec(filename);
        type = match ? `image/${match[1]}` : `image/jpeg`;
      }

      // Medyayı state'e kaydet ve kullanıcının açıklama yazması için formu göster
      setSelectedMediaInfo({ uri: localUri, name: filename, type, mediaType });
    }
  };

  // 2. AŞAMA: Medya ve Açıklamayı Sunucuya Gönder
  // 2. AŞAMA: Medya ve Açıklamayı Sunucuya Gönder
  const submitTestFeedback = async () => {
    if (!selectedMediaInfo) return;

    // KURŞUN GEÇİRMEZ ID KONTROLÜ: Veri nerede saklanıyorsa bul ve çıkar
    const finalUserId = user?.userID || user?.id || user?.user?.userID || user?.user?.id;

    if (!finalUserId) {
      Alert.alert("Oturum Hatası", "Kullanıcı kimliğiniz okunamadı. Lütfen çıkış yapıp tekrar giriş yapın.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('mediaFile', { uri: selectedMediaInfo.uri, name: selectedMediaInfo.name, type: selectedMediaInfo.type });

    // Değerleri String'e çevirerek Backend'e yolluyoruz
    formData.append('gameId', String(selectedGameForTest.itemID));
    formData.append('userId', String(finalUserId));
    formData.append('mediaType', String(selectedMediaInfo.mediaType));
    formData.append('description', String(testDescription || ''));

    try {
      const response = await fetch(`${API_URL}/api/upload-test-media`, {
        method: 'POST',
        body: formData,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const data = await response.json();
      if (data.status === 'Success') {
        Alert.alert('Başarılı!', 'Test veriniz ve açıklamanız geliştiriciye iletildi. Katkınız için teşekkürler.');
        setTestModalVisible(false);
      } else {
        Alert.alert('Hata', 'Yükleme başarısız oldu.');
      }
    } catch (error) {
      console.error('Yükleme hatası:', error);
      Alert.alert('Hata', 'Sunucu bağlantı sorunu yaşandı.');
    } finally {
      setIsUploading(false);
      setSelectedMediaInfo(null);
      setTestDescription('');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  const renderItems = (items) => {
    if (items.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>{activeTab === 'games' ? '🎮' : '📦'}</Text>
          <Text style={styles.emptyText}>
            Kütüphanenizde henüz hiç {activeTab === 'games' ? 'oyun' : 'asset'} yok.
          </Text>
          <TouchableOpacity onPress={() => router.push('/')} style={styles.exploreBtn}>
            <Text style={styles.exploreBtnText}>Keşfetmeye Başla</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return items.map((item, index) => (
      <View key={`${item.itemType}-${item.itemID}-${index}`} style={styles.gameCard}>
        <Image
          source={{ uri: item.itemImage ? `${API_URL}/uploads/${item.itemImage}` : 'https://via.placeholder.com/150' }}
          style={styles.gameCover}
        />
        <View style={styles.gameInfo}>
          <Text style={styles.gameTitle} numberOfLines={1}>{item.itemName}</Text>

          <TouchableOpacity style={styles.downloadBtn}>
            <Text style={styles.downloadBtnText}>📥 {item.itemType === 'Game' ? 'Oyunu' : 'Asseti'} İndir</Text>
          </TouchableOpacity>

          {item.itemType === 'Game' && item.isTestGame === 1 && (
            <TouchableOpacity style={styles.testBtn} onPress={() => openTestModal(item)}>
              <Text style={styles.testBtnText}>🧪 Test Görevi</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>{'< Geri'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kütüphanem</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={{ paddingHorizontal: SPACING.lg, paddingTop: SPACING.md }}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'games' && styles.tabBtnActive]}
            onPress={() => setActiveTab('games')}
          >
            <Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>Oyunlarım ({libraryData.games.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'assets' && styles.tabBtnActive]}
            onPress={() => setActiveTab('assets')}
          >
            <Text style={[styles.tabText, activeTab === 'assets' && styles.tabTextActive]}>Assetlerim ({libraryData.assets.length})</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {renderItems(activeTab === 'games' ? libraryData.games : libraryData.assets)}
      </ScrollView>

      {/* --- TEST YÜKLEME MODALI --- */}
      <Modal visible={testModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} numberOfLines={1}>{selectedGameForTest?.itemName} - Test Görevi</Text>

            {isUploading ? (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.accentColor} />
                <Text style={{ color: COLORS.white, marginTop: 15 }}>Test Verisi Gönderiliyor...</Text>
              </View>
            ) : selectedMediaInfo ? (
              // MEDYA SEÇİLDİYSE GÖRÜNECEK FORM (AÇIKLAMA KISMI)
              <View>
                <View style={styles.selectedMediaPreview}>
                  <Text style={{ color: COLORS.white, fontSize: 12 }}>
                    Seçilen {selectedMediaInfo.mediaType === 'video' ? 'Video' : 'Fotoğraf'}: {selectedMediaInfo.name}
                  </Text>
                </View>

                <Text style={{ color: COLORS.accentColor, fontWeight: 'bold', marginBottom: 10 }}>Karşılaştığınız Durumu Açıklayın:</Text>
                <TextInput
                  style={styles.descriptionInput}
                  placeholder="Örn: 2. seviyede karakter duvara takılıyor..."
                  placeholderTextColor={COLORS.mutedText}
                  multiline
                  textAlignVertical="top"
                  value={testDescription}
                  onChangeText={setTestDescription}
                />

                <TouchableOpacity style={styles.submitTestBtn} onPress={submitTestFeedback}>
                  <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>Geri Bildirimi Gönder</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setSelectedMediaInfo(null)} style={[styles.closeBtn, { marginTop: 10, backgroundColor: 'transparent', borderWidth: 1, borderColor: '#555' }]}>
                  <Text style={{ color: COLORS.white }}>Farklı Medya Seç</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // İLK AŞAMA: MEDYA SEÇİMİ
              <View>
                <Text style={styles.modalSubtitle}>
                  Karşılaştığınız bir hatayı veya deneyiminizi gösterecek bir medya seçin. Sonraki adımda durumu açıklayabileceksiniz.
                </Text>
                <View style={styles.modalButtons}>
                  <TouchableOpacity style={[styles.uploadActionBtn, { backgroundColor: '#e94560' }]} onPress={() => pickMedia('video')}>
                    <Text style={{ fontSize: 24, marginBottom: 5 }}>🎥</Text>
                    <Text style={styles.uploadActionText}>Ekran Kaydı Seç</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.uploadActionBtn, { backgroundColor: '#5b5bfe' }]} onPress={() => pickMedia('image')}>
                    <Text style={{ fontSize: 24, marginBottom: 5 }}>🖼️</Text>
                    <Text style={styles.uploadActionText}>Görüntü Seç</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!isUploading && !selectedMediaInfo && (
              <TouchableOpacity onPress={() => setTestModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ color: COLORS.white, fontWeight: 'bold' }}>İptal Et</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.navbarBg, borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { padding: SPACING.sm }, backBtnText: { color: COLORS.mutedText, fontSize: FONTS.sizes.md },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  scrollContent: { padding: SPACING.lg },

  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.sm },
  tabBtn: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderRadius: RADIUS.sm },
  tabBtnActive: { backgroundColor: 'rgba(233,69,96,0.15)' },
  tabText: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  tabTextActive: { color: COLORS.accentColor },

  gameCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#333' },
  gameCover: { width: 90, height: 90, borderRadius: RADIUS.sm, marginRight: SPACING.md },
  gameInfo: { flex: 1, justifyContent: 'center' },
  gameTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: 10 },

  downloadBtn: { backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: 'center', marginBottom: 8 },
  downloadBtnText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },

  testBtn: { backgroundColor: 'rgba(91,91,254,0.15)', paddingVertical: 8, borderRadius: RADIUS.sm, alignItems: 'center', borderWidth: 1, borderColor: '#5b5bfe' },
  testBtnText: { color: '#5b5bfe', fontSize: 12, fontWeight: 'bold' },

  emptyContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { color: COLORS.mutedText, fontSize: FONTS.sizes.md, marginBottom: 20 },
  exploreBtn: { backgroundColor: COLORS.accentColor, paddingHorizontal: 20, paddingVertical: 10, borderRadius: RADIUS.sm },
  exploreBtnText: { color: COLORS.white, fontWeight: 'bold' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: SPACING.lg },
  modalContent: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.xl, borderWidth: 1, borderColor: '#333' },
  modalTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalButtons: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  uploadActionBtn: { flex: 1, padding: 20, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  uploadActionText: { color: COLORS.white, fontSize: 12, fontWeight: 'bold', textAlign: 'center' },
  closeBtn: { backgroundColor: '#333', padding: 15, borderRadius: RADIUS.sm, alignItems: 'center' },

  // YENİ: Açıklama Formu Stilleri
  selectedMediaPreview: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 10, borderRadius: RADIUS.sm, marginBottom: 20, borderWidth: 1, borderColor: '#444' },
  descriptionInput: { backgroundColor: '#111', color: COLORS.white, height: 100, borderRadius: RADIUS.sm, padding: 15, borderWidth: 1, borderColor: '#333', marginBottom: 20 },
  submitTestBtn: { backgroundColor: COLORS.accentColor, padding: 15, borderRadius: RADIUS.sm, alignItems: 'center' }
});