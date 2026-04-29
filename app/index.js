// =============================================
// SHERIFF GAMES - ANA SAYFA (OYUNLAR) 
// =============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, ActivityIndicator,
  StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router'; 
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { GameCard, SectionTitle } from '../components';

const GENRES = ['Tümü', 'RPG', 'Aksiyon', 'Platform', 'Strateji', 'Yarış', 'Koşu'];
const API_URL = 'http://localhost:3001';

export default function HomeScreen() {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('Tümü');
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Kullanıcı State'i
  const [user, setUser] = useState(null);

  // Sayfaya her dönüldüğünde hafızada kullanıcı var mı kontrol et
  useFocusEffect(
    useCallback(() => {
      const checkUser = async () => {
        try {
          const userData = await AsyncStorage.getItem('user');
          if (userData) setUser(JSON.parse(userData));
        } catch (e) {
          console.error(e);
        }
      };
      checkUser();
    }, [])
  );

  // Çıkış Yap Fonksiyonu
  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  useEffect(() => {
    fetch(`${API_URL}/games`)
      .then(response => response.json())
      .then(data => {
        const formattedGames = data.map(item => ({
          id: item.gamesID.toString(),
          title: item.gameName,
          price: item.gamePrice || 0,
          genre: item.categoryNames || 'Diğer',
          image: item.gameImage ? `${API_URL}/uploads/${item.gameImage}` : 'https://via.placeholder.com/400x250',
          isFeatured: true
        }));
        setGames(formattedGames);
        setLoading(false);
      })
      .catch(error => {
        console.error("Oyunlar çekilirken hata oluştu:", error);
        setLoading(false);
      });
  }, []);

  const featuredGames = games.filter(g => g.isFeatured);
  const filteredGames = games.filter(game => {
    const matchSearch = game.title.toLowerCase().includes(search.toLowerCase());
    const matchGenre = selectedGenre === 'Tümü' || game.genre.includes(selectedGenre);
    return matchSearch && matchGenre;
  });

  const renderGame = ({ item }) => (
    <GameCard
      game={item}
      onPress={() => router.push({ pathname: '/detail', params: { id: item.id, type: 'Game' } })}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accentColor} />
        <Text style={{ color: COLORS.white, marginTop: 10 }}>Oyunlar Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navbarBg} />

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <Text style={styles.logo}>SHERIFF</Text>
        
        {/* KULLANICI GİRİŞ YAPTIYSA */}
        {user ? (
          <View style={styles.loggedInContainer}>
            <Text style={styles.userNameText} numberOfLines={1}>👤 {user.userName}</Text>
            <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.panelBtn} onPress={() => router.push('/dashboard')}>
                  <Text style={styles.btnText}>PANELİM</Text>
                </TouchableOpacity>
              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.btnText}>ÇIKIŞ</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* KULLANICI GİRİŞ YAPMADIYSA */
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}>
            <Text style={styles.loginBtnText}>GİRİŞ YAP</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredGames}
        keyExtractor={item => item.id}
        renderItem={renderGame}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.searchContainer}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput style={styles.searchInput} placeholder="Oyun ara..." placeholderTextColor={COLORS.mutedText} value={search} onChangeText={setSearch} />
            </View>

            {featuredGames.length > 0 && (
              <View style={styles.section}>
                <SectionTitle title="🔥 Öne Çıkan Oyunlar" />
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {featuredGames.map(game => (
                    <TouchableOpacity key={game.id} style={styles.featuredCard} onPress={() => alert(`${game.title} seçildi`)} activeOpacity={0.85}>
                      <View style={styles.featuredImagePlaceholder}>
                         <Text style={styles.featuredTitle}>{game.title}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <SectionTitle title="Tüm Oyunlar" />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll}>
                {GENRES.map(genre => (
                  <TouchableOpacity key={genre} style={[styles.genreChip, selectedGenre === genre && styles.genreChipActive]} onPress={() => setSelectedGenre(genre)}>
                    <Text style={[styles.genreChipText, selectedGenre === genre && styles.genreChipTextActive]}>{genre}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}><Text style={styles.emptyText}>Veritabanında oyun bulunamadı 😔</Text></View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  
  // Navbar & Auth
  navbar: { backgroundColor: COLORS.navbarBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.md, borderBottomWidth: 2, borderBottomColor: COLORS.accentColor },
  logo: { color: COLORS.accentColor, fontSize: FONTS.sizes.lg, fontWeight: 'bold', letterSpacing: 2 },
  
  // Giriş Yapmamış Durum
  loginBtn: { backgroundColor: COLORS.accentColor, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  loginBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.sm, letterSpacing: 1 },
  
  // Giriş Yapmış Durum
  loggedInContainer: { alignItems: 'flex-end' },
  userNameText: { color: COLORS.white, fontSize: 12, marginBottom: 4, fontWeight: 'bold' },
  actionButtons: { flexDirection: 'row', gap: 8 },
  panelBtn: { backgroundColor: '#5b5bfe', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  logoutBtn: { backgroundColor: COLORS.accentColor, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm },
  btnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 10 },

  // Search
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.xl },
  searchIcon: { fontSize: 18, marginRight: SPACING.sm },
  searchInput: { flex: 1, color: COLORS.textColor, fontSize: FONTS.sizes.md, paddingVertical: SPACING.md },

  // Featured
  section: { marginBottom: SPACING.xl },
  featuredCard: { width: 200, marginRight: SPACING.md, borderRadius: RADIUS.md, overflow: 'hidden' },
  featuredImagePlaceholder: { backgroundColor: COLORS.cardBg, height: 120, borderRadius: RADIUS.md, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.accentColor + '44', padding: SPACING.md },
  featuredTitle: { color: COLORS.white, fontWeight: 'bold', fontSize: FONTS.sizes.sm, textAlign: 'center' },

  // Genre Chips
  genreScroll: { marginBottom: SPACING.md },
  genreChip: { backgroundColor: COLORS.cardBg, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, marginRight: SPACING.sm, borderWidth: 1, borderColor: 'transparent' },
  genreChipActive: { backgroundColor: COLORS.accentColor + '22', borderColor: COLORS.accentColor },
  genreChipText: { color: COLORS.mutedText, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  genreChipTextActive: { color: COLORS.accentColor },

  // List
  listContent: { padding: SPACING.xl },
  row: { justifyContent: 'space-between', gap: SPACING.md },
  emptyContainer: { alignItems: 'center', paddingVertical: SPACING.section },
  emptyText: { color: COLORS.mutedText, fontSize: FONTS.sizes.lg },
});