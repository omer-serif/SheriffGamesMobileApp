// =============================================
// SHERIFF GAMES - GELİŞMİŞ PANELİM (DASHBOARD)
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, ActivityIndicator, Image, Alert, Modal, TextInput, Dimensions
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { BarChart } from 'react-native-chart-kit';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const API_URL = 'http://localhost:3001';
const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [user, setUser] = useState(null);
  const [myGames, setMyGames] = useState([]);
  const [myAssets, setMyAssets] = useState([]);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('games');

  // Modal State'leri
  const [statsModalVisible, setStatsModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [commentsModalVisible, setCommentsModalVisible] = useState(false);

  // İstatistik/Grafik State'leri
  const [itemSalesData, setItemSalesData] = useState([]);
  const [chartData, setChartData] = useState({ labels: ['Yok'], datasets: [{ data: [0] }] });
  const [selectedItemName, setSelectedItemName] = useState('');

  // Yorum State'leri
  const [itemComments, setItemComments] = useState([]);

  // Düzenleme (Edit) State'leri
  const [editType, setEditType] = useState('');
  const [editId, setEditId] = useState('');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrice, setEditPrice] = useState('0');
  const [editCoverImage, setEditCoverImage] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // --- YENİ EKLENEN GALERİ STATE'LERİ ---
  const [editGalleryImages, setEditGalleryImages] = useState([]); 
  const [newGalleryImages, setNewGalleryImages] = useState([]); 
  const [deletedGalleryIDs, setDeletedGalleryIDs] = useState([]);

  // 1. ANA VERİLERİ ÇEK
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const userDataStr = await AsyncStorage.getItem('user');
      if (!userDataStr) { router.replace('/login'); return; }
      const currentUser = JSON.parse(userDataStr);
      setUser(currentUser);

      const userID = currentUser.userID;
      const [gamesRes, assetsRes, salesRes] = await Promise.all([
        fetch(`${API_URL}/api/my-games/${userID}`),
        fetch(`${API_URL}/api/my-assets/${userID}`),
        fetch(`${API_URL}/api/my-sales/${userID}`)
      ]);

      setMyGames(await gamesRes.json());
      setMyAssets(await assetsRes.json());
      setSales(await salesRes.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchDashboardData(); }, []));

  // 2. SİLME İŞLEMİ
  const handleDelete = (type, id, name) => {
    Alert.alert("Emin misin?", `${name} kalıcı olarak silinecek.`, [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/delete-item`, {
              method: 'DELETE', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type, id })
            });
            const data = await res.json();
            if(data.status === 'Success') { Alert.alert('Başarılı', 'Silindi.'); fetchDashboardData(); }
          } catch(err) { Alert.alert('Hata', 'Silinemedi.'); }
        } 
      }
    ]);
  };

  // 3. GRAFİK MODALI
  const openStatsModal = async (type, item) => {
    const id = type === 'Game' ? item.gamesID : item.assetID;
    const name = type === 'Game' ? item.gameName : item.assetName;
    setSelectedItemName(name);

    try {
      const res = await fetch(`${API_URL}/api/item-sales-details?type=${type}&id=${id}`);
      const data = await res.json();
      setItemSalesData(data);

      const grouped = {};
      data.forEach(sale => {
        const date = new Date(sale.purchaseDate).toLocaleDateString('tr-TR');
        grouped[date] = (grouped[date] || 0) + 1;
      });

      const labels = Object.keys(grouped).length > 0 ? Object.keys(grouped).map(d => d.substring(0,5)) : ['Veri Yok'];
      const counts = Object.values(grouped).length > 0 ? Object.values(grouped) : [0];

      setChartData({ labels, datasets: [{ data: counts }] });
      setStatsModalVisible(true);
    } catch (err) { Alert.alert('Hata', 'Veri alınamadı.'); }
  };

  // 4. YORUMLAR MODALI
  const openCommentsModal = async (type, item) => {
    const id = type === 'Game' ? item.gamesID : item.assetID;
    const name = type === 'Game' ? item.gameName : item.assetName;
    setSelectedItemName(name);
    setItemComments([]); // Temizle
    setCommentsModalVisible(true);

    try {
      const endpoint = type === 'Game' ? `/api/game-comments/${id}` : `/api/asset-comments/${id}`;
      const res = await fetch(`${API_URL}${endpoint}`);
      const data = await res.json();
      setItemComments(data);
    } catch(err) { Alert.alert('Hata', 'Yorumlar alınamadı.'); }
  };

  // 5. DÜZENLEME MODALINI AÇ VE GALERİ DETAYLARINI ÇEK
  const openEditModal = async (type, item) => {
    const id = type === 'Game' ? item.gamesID : item.assetID;
    setEditType(type);
    setEditId(id);
    setEditName(type === 'Game' ? item.gameName : item.assetName);
    setEditDesc(type === 'Game' ? item.gameDescription : item.assetDescription);
    setEditPrice((type === 'Game' ? item.gamePrice : item.assetPrice)?.toString() || '0');
    setEditCoverImage(null); 
    
    // Galeri state'lerini sıfırla
    setEditGalleryImages([]);
    setNewGalleryImages([]);
    setDeletedGalleryIDs([]);
    
    setEditModalVisible(true);

    try {
      const res = await fetch(`${API_URL}/api/get-edit-details/${type}/${id}`);
      const data = await res.json();
      if(data.galleryImages) setEditGalleryImages(data.galleryImages);
    } catch (error) { console.error("Galeri çekilemedi", error); }
  };

  // Resim Seçiciler
  const pickCoverImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [16, 9], quality: 0.8 });
    if (!result.canceled) setEditCoverImage(result.assets[0]);
  };

  const pickGalleryImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ 
      mediaTypes: ImagePicker.MediaTypeOptions.Images, 
      allowsMultipleSelection: true, 
      quality: 0.8 
    });
    if (!result.canceled) {
      setNewGalleryImages([...newGalleryImages, ...result.assets]);
    }
  };

  // Galeri Yönetimi Silme İşlemleri
  const removeExistingGalleryImage = (imageID) => {
    setDeletedGalleryIDs([...deletedGalleryIDs, imageID]);
    setEditGalleryImages(editGalleryImages.filter(img => img.imageID !== imageID));
  };

  const removeNewGalleryImage = (index) => {
    const updated = [...newGalleryImages];
    updated.splice(index, 1);
    setNewGalleryImages(updated);
  };

  // DÜZENLEMEYİ KAYDET
  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('type', editType);
      formData.append('id', editId);
      formData.append('name', editName);
      formData.append('description', editDesc);
      formData.append('price', editPrice);

      formData.append('deletedImageIDs', JSON.stringify(deletedGalleryIDs));

      if (editCoverImage) {
        const localUri = editCoverImage.uri;
        const filename = localUri.split('/').pop() || 'cover.jpg';
        const type = `image/${filename.split('.').pop() || 'jpeg'}`;
        formData.append('coverImage', { uri: localUri, name: filename, type });
      }

      newGalleryImages.forEach((img, index) => {
        const localUri = img.uri;
        const filename = localUri.split('/').pop() || `gallery_${index}.jpg`;
        const type = `image/${filename.split('.').pop() || 'jpeg'}`;
        formData.append('newGalleryImages', { uri: localUri, name: filename, type });
      });

      const response = await fetch(`${API_URL}/api/update-item`, {
        method: 'PUT', body: formData, headers: { 'Accept': 'application/json' },
      });

      const data = await response.json();
      if (data.status === 'Success') {
        Alert.alert('Başarılı', 'Tüm değişiklikler kaydedildi!');
        setEditModalVisible(false);
        fetchDashboardData();
      } else { Alert.alert('Hata', 'Kaydedilemedi.'); }
    } catch (err) { Alert.alert('Hata', 'Sunucu bağlantı hatası.'); } 
    finally { setIsSaving(false); }
  };

  // ==========================================
  // HESAPLAMALAR VE ÇİZİM (RENDER) ÖNCESİ
  // ==========================================
  const safeSales = Array.isArray(sales) ? sales : [];
  const totalDownloads = safeSales.length;
  const totalRevenue = safeSales.reduce((sum, sale) => sum + (sale.price || 0), 0);
  const getInitial = (name) => name ? name.charAt(0).toUpperCase() : '?';

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.accentColor} />
      </SafeAreaView>
    );
  }

  // ==========================================
  // EKRAN TASARIMI (RETURN BLOĞU)
  // ==========================================
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>{'< Geri'}</Text></TouchableOpacity>
        <Text style={styles.headerTitle}>Panelim</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* DOĞRU YERLEŞTİRİLMİŞ PROFİL KARTI VE BUTONLAR */}
        <View style={styles.profileCard}>
          <View style={styles.avatarCircle}><Text style={styles.avatarText}>{getInitial(user?.userName)}</Text></View>
          <Text style={styles.userName}>{user?.userName}</Text>
          <Text style={styles.userRole}>Geliştirici Hesabı</Text>
          
          {/* Eklenecek Yeni Butonlar */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' }}>
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(233,69,96,0.15)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: COLORS.accentColor, alignItems: 'center' }}
              onPress={() => router.push({ pathname: '/publish', params: { type: 'Game' } })}
            >
              <Text style={{ color: COLORS.accentColor, fontWeight: 'bold', fontSize: 12 }}>+ Oyun Yükle</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(91,91,254,0.15)', padding: 10, borderRadius: 6, borderWidth: 1, borderColor: '#5b5bfe', alignItems: 'center' }}
              onPress={() => router.push({ pathname: '/publish', params: { type: 'Asset' } })}
            >
              <Text style={{ color: '#5b5bfe', fontWeight: 'bold', fontSize: 12 }}>+ Asset Yükle</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Genel Performans</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}><Text style={styles.statIcon}>📥</Text><Text style={styles.statValue}>{totalDownloads}</Text><Text style={styles.statLabel}>Toplam İndirme</Text></View>
          <View style={styles.statBox}><Text style={styles.statIcon}>💰</Text><Text style={styles.statValue}>₺{totalRevenue.toFixed(2)}</Text><Text style={styles.statLabel}>Toplam Kazanç</Text></View>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'games' && styles.tabBtnActive]} onPress={() => setActiveTab('games')}><Text style={[styles.tabText, activeTab === 'games' && styles.tabTextActive]}>Oyunlarım ({myGames.length})</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.tabBtn, activeTab === 'assets' && styles.tabBtnActive]} onPress={() => setActiveTab('assets')}><Text style={[styles.tabText, activeTab === 'assets' && styles.tabTextActive]}>Assetlerim ({myAssets.length})</Text></TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>{activeTab === 'games' ? 'Yayınlanan Oyunlar' : 'Yayınlanan Assetler'}</Text>

        {(activeTab === 'games' ? myGames : myAssets).map(item => {
          const isGame = activeTab === 'games';
          const id = isGame ? item.gamesID : item.assetID;
          const name = isGame ? item.gameName : item.assetName;
          const price = isGame ? item.gamePrice : item.assetPrice;
          const image = isGame ? item.gameImage : item.assetImage;
          const type = isGame ? 'Game' : 'Asset';

          return (
            <View key={id} style={styles.itemCard}>
              <View style={styles.itemImageContainer}>
                {image ? <Image source={{ uri: `${API_URL}/uploads/${image}` }} style={styles.itemImage} /> : <Text style={styles.noImageText}>Resim Yok</Text>}
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemTitle}>{name}</Text>
                <Text style={styles.itemPrice}>{price === 0 || !price ? 'Ücretsiz' : `₺${price}`}</Text>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#5b5bfe' }]} onPress={() => openEditModal(type, item)}>
                  <Text style={styles.actionBtnText}>✏️ Düzenle</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#e94560' }]} onPress={() => handleDelete(type, id, name)}>
                  <Text style={styles.actionBtnText}>🗑️ Sil</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#4caf50' }]} onPress={() => router.push({ pathname: '/detail', params: { id: id, type: type } })}>
                  <Text style={styles.actionBtnText}>👁️ Sayfayı Gör</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f39c12' }]} onPress={() => openStatsModal(type, item)}>
                  <Text style={styles.actionBtnText}>📊 Detay & Grafik</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#9b59b6', width: '100%' }]} onPress={() => openCommentsModal(type, item)}>
                  <Text style={styles.actionBtnText}>💬 Yorumları Gör</Text>
              </TouchableOpacity>
            </View>
          );
        })}
        <View style={{ height: 50 }} />
      </ScrollView>

      {/* MODALLAR */}
      <Modal visible={commentsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedItemName} - Yorumlar</Text>
            <TouchableOpacity onPress={() => setCommentsModalVisible(false)}><Text style={styles.closeBtn}>✖</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            {itemComments.length > 0 ? itemComments.map((comment, index) => (
              <View key={index} style={styles.commentBox}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>👤 {comment.userName}</Text>
                  <Text style={styles.commentDate}>{new Date(comment.commentDate).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.commentText}>{comment.commentText}</Text>
              </View>
            )) : <Text style={styles.emptyText}>Henüz bu içeriğe yorum yapılmamış.</Text>}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={statsModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{selectedItemName} - İndirme</Text>
            <TouchableOpacity onPress={() => setStatsModalVisible(false)}><Text style={styles.closeBtn}>✖</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.chartWrapper}>
              <Text style={styles.chartTitle}>Zaman İçindeki İndirmeler</Text>
              <BarChart
                data={chartData} width={screenWidth - 40} height={220} yAxisLabel=""
                chartConfig={{ backgroundColor: COLORS.cardBg, backgroundGradientFrom: COLORS.cardBg, backgroundGradientTo: COLORS.cardBg, decimalPlaces: 0, color: (opacity = 1) => `rgba(0, 188, 212, ${opacity})`, labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})` }}
                style={{ borderRadius: 8, marginVertical: 8 }}
              />
            </View>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderText}>KULLANICI</Text><Text style={styles.tableHeaderText}>TARİH</Text><Text style={styles.tableHeaderText}>TUTAR</Text>
            </View>
            {itemSalesData.length > 0 ? itemSalesData.map((s, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={styles.tableRowText} numberOfLines={1}>{s.buyerName}</Text>
                <Text style={styles.tableRowText}>{new Date(s.purchaseDate).toLocaleDateString()}</Text>
                <Text style={styles.tableRowText}>{s.price === 0 ? 'Ücretsiz' : `₺${s.price}`}</Text>
              </View>
            )) : <Text style={styles.emptyText}>Henüz satış/indirme yok.</Text>}
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Düzenle: {editType === 'Game' ? 'Oyun' : 'Asset'}</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}><Text style={styles.closeBtn}>✖</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            
            <Text style={styles.label}>Ad</Text>
            <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholderTextColor={COLORS.mutedText}/>

            <Text style={styles.label}>Açıklama</Text>
            <TextInput style={[styles.input, { height: 100 }]} value={editDesc} onChangeText={setEditDesc} multiline textAlignVertical="top"/>

            <Text style={styles.label}>Fiyat (₺)</Text>
            <TextInput style={styles.input} value={editPrice} onChangeText={setEditPrice} keyboardType="numeric"/>

            <Text style={styles.label}>Kapak Görseli</Text>
            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickCoverImage}>
              {editCoverImage ? (
                <Image source={{ uri: editCoverImage.uri }} style={styles.pickedImage} />
              ) : (
                <Text style={styles.imagePickerText}>📷 Kapak Değiştir</Text>
              )}
            </TouchableOpacity>

            {editGalleryImages.length > 0 && (
              <>
                <Text style={styles.label}>Galeri Görselleri (Mevcut)</Text>
                <View style={styles.galleryContainer}>
                  {editGalleryImages.map((img) => (
                    <View key={img.imageID} style={styles.galleryThumbWrapper}>
                      <Image source={{ uri: `${API_URL}/uploads/${img.image}` }} style={styles.galleryThumb} />
                      <TouchableOpacity style={styles.removeBadge} onPress={() => removeExistingGalleryImage(img.imageID)}>
                        <Text style={styles.removeBadgeText}>✖</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {newGalleryImages.length > 0 && (
              <>
                <Text style={styles.label}>Yeni Eklenecekler</Text>
                <View style={styles.galleryContainer}>
                  {newGalleryImages.map((img, index) => (
                    <View key={index} style={styles.galleryThumbWrapper}>
                      <Image source={{ uri: img.uri }} style={styles.galleryThumb} />
                      <TouchableOpacity style={styles.removeBadge} onPress={() => removeNewGalleryImage(index)}>
                        <Text style={styles.removeBadgeText}>✖</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            <Text style={styles.label}>Yeni Görsel Ekle</Text>
            <TouchableOpacity style={styles.addGalleryBtn} onPress={pickGalleryImages}>
              <Text style={styles.addGalleryBtnText}>+ Yeni Resimler Ekle</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSaveEdit} disabled={isSaving}>
              {isSaving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>}
            </TouchableOpacity>
            
            <View style={{ height: 40 }}/>
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

// =============================================
// STİLLER
// =============================================
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.navbarBg, borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { padding: SPACING.sm }, backBtnText: { color: COLORS.mutedText, fontSize: FONTS.sizes.md },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  scrollContent: { padding: SPACING.xl },

  profileCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.xxl, borderWidth: 1, borderColor: '#333' },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: COLORS.accentColor, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, backgroundColor: 'rgba(233,69,96,0.1)' },
  avatarText: { color: COLORS.accentColor, fontSize: 32, fontWeight: 'bold' },
  userName: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: 4 },
  userRole: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm },

  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: SPACING.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.xxl },
  statBox: { flex: 0.48, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  statIcon: { fontSize: 24, marginBottom: SPACING.sm }, statValue: { color: COLORS.white, fontSize: FONTS.sizes.xl, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { color: COLORS.mutedText, fontSize: FONTS.sizes.xs },

  tabContainer: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: 4, marginBottom: SPACING.xl },
  tabBtn: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center', borderRadius: RADIUS.sm },
  tabBtnActive: { backgroundColor: 'rgba(233,69,96,0.15)' },
  tabText: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  tabTextActive: { color: COLORS.accentColor },

  itemCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: '#333' },
  itemImageContainer: { height: 150, backgroundColor: '#161625', borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.md, overflow: 'hidden' },
  itemImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  noImageText: { color: COLORS.accentColor, fontWeight: 'bold' },
  itemInfo: { marginBottom: SPACING.lg },
  itemTitle: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: 'bold', marginBottom: 4 },
  itemPrice: { color: COLORS.accentColor, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', gap: SPACING.md, marginBottom: SPACING.md },
  actionBtn: { flex: 1, paddingVertical: SPACING.md, borderRadius: RADIUS.sm, alignItems: 'center' },
  actionBtnText: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  emptyText: { color: COLORS.mutedText, textAlign: 'center', marginTop: SPACING.xl, fontSize: FONTS.sizes.md },

  // Modallar
  modalContainer: { flex: 1, backgroundColor: COLORS.bgColor },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, borderBottomWidth: 1, borderColor: '#333' },
  modalTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  closeBtn: { color: COLORS.accentColor, fontSize: 24, fontWeight: 'bold' },
  modalBody: { padding: SPACING.xl },
  
  // Grafik
  chartWrapper: { backgroundColor: COLORS.cardBg, padding: SPACING.md, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.accentColor, marginBottom: SPACING.xl },
  chartTitle: { color: COLORS.white, textAlign: 'center', marginBottom: SPACING.md, fontWeight: 'bold' },
  tableHeader: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#333', paddingBottom: SPACING.sm, marginBottom: SPACING.sm },
  tableHeaderText: { color: COLORS.accentColor, fontSize: 12, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  tableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderColor: '#222' },
  tableRowText: { color: COLORS.white, fontSize: 12, flex: 1, textAlign: 'center' },

  // Yorumlar Modalı Stilleri
  commentBox: { backgroundColor: COLORS.cardBg, padding: SPACING.md, borderRadius: RADIUS.md, marginBottom: SPACING.md, borderWidth: 1, borderColor: '#333' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  commentUser: { color: COLORS.accentColor, fontWeight: 'bold', fontSize: FONTS.sizes.sm },
  commentDate: { color: COLORS.mutedText, fontSize: 10 },
  commentText: { color: COLORS.white, fontSize: FONTS.sizes.sm, lineHeight: 20 },

  // Düzenleme Formu
  label: { color: COLORS.accentColor, fontWeight: 'bold', marginBottom: SPACING.sm, marginTop: SPACING.md },
  input: { backgroundColor: COLORS.cardBg, color: COLORS.white, padding: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444' },
  imagePickerBtn: { backgroundColor: COLORS.cardBg, height: 100, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  imagePickerText: { color: COLORS.mutedText },
  pickedImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  saveBtn: { backgroundColor: COLORS.accentColor, padding: SPACING.lg, borderRadius: RADIUS.sm, alignItems: 'center', marginTop: SPACING.xxl },
  saveBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md },

  // Galeri Yönetimi Stilleri
  addGalleryBtn: { backgroundColor: COLORS.cardBg, padding: SPACING.lg, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444', borderStyle: 'dashed', alignItems: 'center' },
  addGalleryBtnText: { color: COLORS.mutedText, fontWeight: 'bold' },
  galleryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: SPACING.sm },
  galleryThumbWrapper: { position: 'relative', width: 75, height: 75, marginBottom: 5 },
  galleryThumb: { width: '100%', height: '100%', borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#444' },
  removeBadge: { position: 'absolute', top: -5, right: -5, backgroundColor: COLORS.accentColor, width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  removeBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' }
});