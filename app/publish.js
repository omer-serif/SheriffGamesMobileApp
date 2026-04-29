import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Image, Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const API_URL = 'http://localhost:3001';

export default function PublishScreen() {
  const { type } = useLocalSearchParams(); // 'Game' veya 'Asset'
  const isGame = type === 'Game';

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]); 

  // Form State'leri
  const [name, setName] = useState('');
  const [shortDesc, setShortDesc] = useState(''); 
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCats, setSelectedCats] = useState([]);

  // Dosya State'leri
  const [coverImage, setCoverImage] = useState(null);
  const [galleryImages, setGalleryImages] = useState([]);
  const [mainFile, setMainFile] = useState(null);

  useEffect(() => {
    const init = async () => {
      const userData = await AsyncStorage.getItem('user');
      if (!userData) {
        Alert.alert('Hata', 'İçerik yüklemek için giriş yapmalısınız.');
        router.replace('/login');
        return;
      }
      setUser(JSON.parse(userData));

      
      try {
        const endpoint = isGame ? '/game-types' : '/asset-types';
        const res = await fetch(`${API_URL}${endpoint}`);
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error('Kategoriler çekilemedi', err);
      }
    };
    init();
  }, [type]);


  const toggleCategory = (id) => {
    if (selectedCats.includes(id)) {
      setSelectedCats(selectedCats.filter(catId => catId !== id));
    } else {
      setSelectedCats([...selectedCats, id]);
    }
  };

  const pickCover = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) setCoverImage(result.assets[0]);
  };

  const pickGallery = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsMultipleSelection: true, quality: 0.8 });
    if (!result.canceled) setGalleryImages([...galleryImages, ...result.assets]);
  };

  const pickMainFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (!result.canceled && result.assets.length > 0) {
      setMainFile(result.assets[0]);
    }
  };

  const removeGalleryImage = (index) => {
    const newGallery = [...galleryImages];
    newGallery.splice(index, 1);
    setGalleryImages(newGallery);
  };

  // YAYIMLAMA İŞLEMİ
  const handlePublish = async () => {
    if (!name || !desc || !coverImage || !mainFile || selectedCats.length === 0) {
      Alert.alert('Eksik Bilgi', 'Lütfen yıldızlı (*) tüm zorunlu alanları ve en az 1 kategori doldurun.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      
      // Metin alanları
      const finalDesc = isGame && shortDesc ? `${shortDesc}\n\n${desc}` : desc; // Kısa açıklamayı birleştir
      formData.append('userID', user.userID);
      formData.append(isGame ? 'gameName' : 'assetName', name);
      formData.append(isGame ? 'gameDescription' : 'assetDescription', finalDesc);
      formData.append(isGame ? 'gamePrice' : 'assetPrice', price || 0);
      formData.append(isGame ? 'gameTypes' : 'assetTypes', JSON.stringify(selectedCats));

      // Kapak Resmi
      const coverUri = coverImage.uri;
      const coverName = coverUri.split('/').pop() || 'cover.jpg';
      formData.append('coverImage', { uri: coverUri, name: coverName, type: `image/${coverName.split('.').pop()}` });

      const fileUri = mainFile.uri;
      const fileName = mainFile.name || 'file.zip';
      formData.append(isGame ? 'gameFile' : 'assetFile', { uri: fileUri, name: fileName, type: mainFile.mimeType || 'application/zip' });

      galleryImages.forEach((img, idx) => {
        const gUri = img.uri;
        const gName = gUri.split('/').pop() || `gallery_${idx}.jpg`;
        formData.append('galleryImages', { uri: gUri, name: gName, type: `image/${gName.split('.').pop()}` });
      });

      const endpoint = isGame ? '/api/add-game' : '/api/add-asset';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', body: formData, headers: { 'Accept': 'application/json' }
      });

      const data = await response.json();
      if (data.status === 'Success') {
        Alert.alert('🎉 Başarılı!', isGame ? 'Oyunun başarıyla yayımlandı!' : 'Assetin başarıyla yayımlandı!');
        router.back();
      } else {
        Alert.alert('Hata', 'Yükleme başarısız.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Bağlantı Hatası', 'Sunucuya dosya gönderilirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>İptal</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>{isGame ? 'Yeni Oyununu Yayımla' : 'Yeni Asset Yayımla'}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        <Text style={styles.sectionTitle}>1. {isGame ? 'Temel Tanıtım' : 'Asset Bilgileri'}</Text>
        
        <Text style={styles.label}>{isGame ? 'Oyun Adı *' : 'Asset Adı *'}</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />

        {isGame && (
          <>
            <Text style={styles.label}>Kısa Açıklama</Text>
            <TextInput style={styles.input} value={shortDesc} onChangeText={setShortDesc} />
          </>
        )}

        <Text style={styles.label}>{isGame ? 'Detaylı Açıklama *' : 'Açıklama *'}</Text>
        <TextInput style={[styles.input, { height: 120 }]} value={desc} onChangeText={setDesc} multiline textAlignVertical="top" />
        <Text style={styles.sectionTitle}>2. Görseller ve Dosyalar</Text>
        
        <Text style={styles.label}>Kapak Görseli (Zorunlu) *</Text>
        <TouchableOpacity style={styles.filePickerBtn} onPress={pickCover}>
          {coverImage ? <Image source={{ uri: coverImage.uri }} style={styles.previewImage} /> : <Text style={styles.filePickerText}>🖼️ Kapak Resmi Seç</Text>}
        </TouchableOpacity>

        <Text style={styles.label}>{isGame ? 'Oyun İçi Görseller (Çoklu Seçim - Opsiyonel)' : 'Asset Galeri Görselleri (Çoklu Seçim - Opsiyonel)'}</Text>
        <TouchableOpacity style={styles.filePickerBtn} onPress={pickGallery}>
          <Text style={styles.filePickerText}>📸 Galeri Görselleri Seç</Text>
        </TouchableOpacity>
        
        {galleryImages.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
            {galleryImages.map((img, index) => (
              <View key={index} style={styles.thumbWrapper}>
                <Image source={{ uri: img.uri }} style={styles.thumbImage} />
                <TouchableOpacity style={styles.removeThumbBtn} onPress={() => removeGalleryImage(index)}>
                  <Text style={styles.removeThumbText}>✖</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}

        <Text style={styles.label}>{isGame ? 'Oyun Dosyası (.zip, .exe vb.) *' : 'Asset Dosyası (.zip, .unitypackage vb.) *'}</Text>
        <TouchableOpacity style={[styles.filePickerBtn, mainFile && { borderColor: COLORS.accentColor, borderStyle: 'solid' }]} onPress={pickMainFile}>
          <Text style={[styles.filePickerText, mainFile && { color: COLORS.accentColor, fontWeight: 'bold' }]}>
            {mainFile ? `✅ ${mainFile.name}` : '📤 Dosya Yükle'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>3. {isGame ? 'Sınıflandırma ve Fiyatlandırma' : 'Tür ve Fiyat'}</Text>

        <Text style={styles.label}>{isGame ? 'Kategoriler *' : 'Asset Türleri * (Çoklu Seçim)'}</Text>
        <View style={styles.checkboxContainer}>
          {categories.map(cat => {
            const catId = isGame ? cat.gameTypeID : cat.assetTypeID;
            const catName = isGame ? cat.gameType : cat.type;
            const isSelected = selectedCats.includes(catId);
            return (
              <TouchableOpacity key={catId} style={styles.checkboxWrapper} onPress={() => toggleCategory(catId)} activeOpacity={1}>
                <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                  {isSelected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>{catName}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Fiyatlandırma (₺) (Ücretsiz ise 0 yazın)</Text>
        <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="numeric" placeholder="Örn: 50" placeholderTextColor={COLORS.mutedText} />

        <TouchableOpacity style={styles.publishBtn} onPress={handlePublish} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.publishBtnText}>{isGame ? 'OYUNU YAYIMLA' : 'ASSETİ YAYIMLA'}</Text>}
        </TouchableOpacity>
        
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.navbarBg, borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { padding: SPACING.sm }, backBtnText: { color: COLORS.mutedText, fontSize: FONTS.sizes.md },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  scrollContent: { padding: SPACING.xl },

  sectionTitle: { color: COLORS.accentColor, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginTop: SPACING.xl, marginBottom: SPACING.lg },
  
  label: { color: COLORS.white, fontWeight: 'bold', fontSize: 13, marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.cardBg, color: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444' },
  
  filePickerBtn: { backgroundColor: COLORS.cardBg, padding: SPACING.lg, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', height: 80 },
  filePickerText: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover', borderRadius: RADIUS.sm },

  thumbWrapper: { position: 'relative', width: 80, height: 80, marginRight: SPACING.md, marginTop: SPACING.sm },
  thumbImage: { width: '100%', height: '100%', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444' },
  removeThumbBtn: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.accentColor, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  removeThumbText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },

  checkboxContainer: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: COLORS.cardBg, padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444' },
  checkboxWrapper: { flexDirection: 'row', alignItems: 'center', width: '48%', marginBottom: SPACING.md },
  checkbox: { width: 20, height: 20, borderWidth: 2, borderColor: '#555', borderRadius: 4, marginRight: 8, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.bgColor },
  checkboxActive: { backgroundColor: '#5b5bfe', borderColor: '#5b5bfe' },
  checkmark: { color: COLORS.white, fontSize: 12, fontWeight: 'bold' },
  checkboxLabel: { color: COLORS.white, fontSize: 13, fontWeight: 'bold' },

  publishBtn: { backgroundColor: '#5b5bfe', padding: SPACING.lg, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.xxl },
  publishBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md, letterSpacing: 1 }
});