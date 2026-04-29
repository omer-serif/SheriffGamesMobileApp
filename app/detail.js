import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, Image,
  TouchableOpacity, ActivityIndicator, Alert, TextInput, Dimensions
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const API_URL = 'http://localhost:3001';
const PLACEHOLDER_IMAGE = require('../assets/images/sheriffGamesLogo.png');

export default function DetailScreen() {
  const { id, type } = useLocalSearchParams(); 
  
  const [user, setUser] = useState(null);
  const [item, setItem] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [commenting, setCommenting] = useState(false);
  
  // KAPAK RESMİ HATA TAKİBİ
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    checkUser();
    fetchData();
  }, []);

  const checkUser = async () => {
    const userData = await AsyncStorage.getItem('user');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemRes = await fetch(`${API_URL}/${type === 'Game' ? 'games' : 'assets'}/${id}`);
      if (!itemRes.ok) throw new Error('Ürün bulunamadı');
      const itemData = await itemRes.json();
      
      const formattedItem = {
        title: type === 'Game' ? itemData.gameName : itemData.assetName,
        desc: type === 'Game' ? itemData.gameDescription : itemData.assetDescription,
        price: type === 'Game' ? itemData.gamePrice : itemData.assetPrice,
        cover: type === 'Game' ? itemData.gameImage : itemData.assetImage,
        publisher: itemData.publisherName || 'Bilinmiyor',
        category: type === 'Game' ? itemData.categoryNames : itemData.typeNames,
        gallery: itemData.galleryImages || []
      };
      setItem(formattedItem);

      const commentRes = await fetch(`${API_URL}/api/${type === 'Game' ? 'game' : 'asset'}-comments/${id}`);
      const commentData = await commentRes.json();
      setComments(commentData);

    } catch (error) {
      console.error(error);
      Alert.alert('Hata', 'İçerik yüklenemedi.');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!user) {
      Alert.alert('Giriş Gerekli', 'Satın almak için giriş yapmalısınız.', [
        { text: 'İptal', style: 'cancel' },
        { text: 'Giriş Yap', onPress: () => router.push('/login') }
      ]);
      return;
    }

    setBuying(true);
    try {
      const endpoint = type === 'Game' ? '/api/buy-game' : '/api/buy-asset';
      const payload = {
        userID: user.userID,
        price: item.price || 0,
        ...(type === 'Game' ? { gameID: id } : { assetID: id }) 
      };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.status === 'Success') {
        Alert.alert('🎉 Başarılı!', `${item.title} kütüphanenize eklendi. Panelinizden görebilirsiniz.`);
      } else {
        if (data.message && data.message.includes('ER_DUP_ENTRY')) {
          Alert.alert('Zaten Sahipsiniz', 'Bu içerik zaten kütüphanenizde mevcut.');
        } else {
          Alert.alert('Satın Alma Başarısız', data.message || data.sqlMessage || 'Bilinmeyen bir hata.');
        }
      }
    } catch (err) {
      Alert.alert('Bağlantı Hatası', 'Sunucuya ulaşılamıyor.');
    } finally {
      setBuying(false);
    }
  };

  const handleAddComment = async () => {
    if (!user) {
      Alert.alert('Bilgi', 'Yorum yapmak için giriş yapmalısınız.');
      return;
    }
    if (!newComment.trim()) return;

    setCommenting(true);
    try {
      const endpoint = type === 'Game' ? '/api/add-game-comment' : '/api/add-asset-comment';
      const payload = {
        userID: user.userID,
        commentText: newComment,
        ...(type === 'Game' ? { gameID: id } : { assetID: id }) 
      };

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();

      if (res.ok && (data.status === 'Success' || data.message === 'Yorum eklendi')) {
        setNewComment(''); 
        fetchData(); 
      } else {
        Alert.alert('Yorum Gönderilemedi', data.sqlMessage || data.message || 'Bilinmeyen hata');
      }
    } catch (err) {
      Alert.alert('Bağlantı Hatası', 'Yorumunuz iletilemedi.');
    } finally {
      setCommenting(false);
    }
  };

  if (loading || !item) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accentColor} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Text style={styles.backBtnText}>{'< Geri'}</Text></TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{item.title}</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Image 
          source={
            (!item.cover || imgError) 
              ? PLACEHOLDER_IMAGE 
              : { uri: `${API_URL}/uploads/${item.cover}` }
          } 
          style={styles.coverImage} 
          onError={() => setImgError(true)}
        />

        <View style={styles.content}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.publisher}>Geliştirici: <Text style={{ color: COLORS.accentColor }}>{item.publisher}</Text></Text>
            </View>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>{item.price === 0 || !item.price ? 'ÜCRETSİZ' : `₺${item.price}`}</Text>
            </View>
          </View>

          {item.category && (
            <View style={styles.categoryContainer}>
              {item.category.split(',').map((cat, idx) => (
                <View key={idx} style={styles.categoryChip}><Text style={styles.categoryText}>{cat.trim()}</Text></View>
              ))}
            </View>
          )}

          <Text style={styles.sectionTitle}>Hakkında</Text>
          <Text style={styles.description}>{item.desc || 'Bu içerik için açıklama girilmemiş.'}</Text>

          {item.gallery.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Galeri</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryScroll}>
                {item.gallery.map((img, idx) => (
                  <Image key={idx} source={{ uri: `${API_URL}/uploads/${img}` }} style={styles.galleryImage} />
                ))}
              </ScrollView>
            </>
          )}

          <Text style={[styles.sectionTitle, { marginTop: SPACING.xl }]}>Yorumlar ({comments.length})</Text>
          
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder={user ? "Yorumunu yaz..." : "Yorum yapmak için giriş yapmalısın."}
              placeholderTextColor={COLORS.mutedText}
              multiline
              editable={!!user}
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity 
              style={[styles.commentBtn, (!user || !newComment.trim()) && { opacity: 0.5 }]} 
              onPress={handleAddComment}
              disabled={!user || !newComment.trim() || commenting}
            >
              {commenting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.commentBtnText}>Gönder</Text>}
            </TouchableOpacity>
          </View>

          {comments.length > 0 ? comments.map((comment, idx) => (
            <View key={idx} style={styles.commentCard}>
              <View style={styles.commentHeader}>
                <Text style={styles.commentUser}>👤 {comment.userName}</Text>
                <Text style={styles.commentDate}>{new Date(comment.commentDate).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.commentText}>{comment.commentText}</Text>
            </View>
          )) : <Text style={styles.emptyComments}>İlk yorumu sen yap!</Text>}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      <View style={styles.buyFooter}>
        <View style={styles.buyInfo}>
          <Text style={styles.buyTitle}>{item.title}</Text>
          <Text style={styles.buyPrice}>{item.price === 0 || !item.price ? 'Ücretsiz' : `₺${item.price}`}</Text>
        </View>
        <TouchableOpacity style={styles.buyBtn} onPress={handleBuy} disabled={buying}>
          {buying ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buyBtnText}>SATIN AL</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.lg, backgroundColor: COLORS.navbarBg, borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { padding: SPACING.sm }, backBtnText: { color: COLORS.mutedText, fontSize: FONTS.sizes.md },
  headerTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold', flex: 1, textAlign: 'center' },
  
  coverImage: { width: '100%', height: 250, resizeMode: 'cover' },
  content: { padding: SPACING.xl },
  
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.md },
  title: { color: COLORS.white, fontSize: FONTS.sizes.xxl, fontWeight: 'bold', marginBottom: 4 },
  publisher: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm },
  priceBadge: { backgroundColor: 'rgba(233,69,96,0.15)', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.accentColor },
  priceText: { color: COLORS.accentColor, fontWeight: 'bold', fontSize: FONTS.sizes.lg },

  categoryContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: SPACING.xl },
  categoryChip: { backgroundColor: '#22223b', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, borderWidth: 1, borderColor: '#444' },
  categoryText: { color: COLORS.mutedText, fontSize: 12, fontWeight: 'bold' },

  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginBottom: SPACING.md },
  description: { color: COLORS.textColor, fontSize: FONTS.sizes.sm, lineHeight: 22, marginBottom: SPACING.xl },

  galleryScroll: { marginBottom: SPACING.xl },
  galleryImage: { width: 280, height: 160, borderRadius: RADIUS.md, marginRight: SPACING.md, borderWidth: 1, borderColor: '#333' },

  commentInputContainer: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.xl, borderWidth: 1, borderColor: '#333' },
  commentInput: { color: COLORS.white, minHeight: 60, textAlignVertical: 'top', marginBottom: SPACING.sm },
  commentBtn: { backgroundColor: '#5b5bfe', alignSelf: 'flex-end', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  commentBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },
  
  commentCard: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.md },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  commentUser: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.sm },
  commentDate: { color: COLORS.mutedText, fontSize: 10 },
  commentText: { color: COLORS.textColor, fontSize: FONTS.sizes.sm, lineHeight: 20 },
  emptyComments: { color: COLORS.mutedText, fontStyle: 'italic', textAlign: 'center', marginTop: SPACING.md },

  buyFooter: { position: 'absolute', bottom: 0, width: '100%', backgroundColor: COLORS.navbarBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.xl, borderTopWidth: 1, borderColor: '#333' },
  buyInfo: { flex: 1 },
  buyTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.sm, marginBottom: 2 },
  buyPrice: { color: COLORS.accentColor, fontWeight: 'bold', fontSize: FONTS.sizes.md },
  buyBtn: { backgroundColor: COLORS.accentColor, paddingHorizontal: 30, paddingVertical: 12, borderRadius: RADIUS.sm },
  buyBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.md, letterSpacing: 1 }
});