import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TextInput, ActivityIndicator,
  StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, ScrollView, Image, Dimensions
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { GameCard, AssetCard, SectionTitle } from '../components';

const API_URL = 'http://localhost:3001';
const GAME_GENRES = ['Tümü', 'RPG', 'Aksiyon', 'Platform', 'Strateji', 'Yarış'];
const ASSET_TYPES = ['Tümü', 'Karakter', 'UI', 'Ses', 'Çevre', 'Animasyon'];

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [viewMode, setViewMode] = useState('home'); 
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tümü');
  
  const [games, setGames] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const checkUser = async () => {
        const userData = await AsyncStorage.getItem('user');
        if (userData) setUser(JSON.parse(userData));
      };
      checkUser();
    }, [])
  );

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [gRes, aRes] = await Promise.all([
          fetch(`${API_URL}/games`),
          fetch(`${API_URL}/assets`)
        ]);
        
        const gData = await gRes.json();
        const aData = await aRes.json();

        setGames(gData.map(i => ({
          id: i.gamesID.toString(), title: i.gameName, price: i.gamePrice || 0,
          genre: i.categoryNames || 'Diğer', image: i.gameImage ? `${API_URL}/uploads/${i.gameImage}` : null
        })));

        setAssets(aData.map(i => ({
          id: i.assetID.toString(), title: i.assetName, price: i.assetPrice || 0,
          type: i.typeNames ? i.typeNames.split(', ')[0] : 'Diğer', image: i.assetImage ? `${API_URL}/uploads/${i.assetImage}` : null
        })));

      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('user');
    setUser(null);
  };

  const filteredData = viewMode === 'games' 
    ? games.filter(g => g.title.toLowerCase().includes(search.toLowerCase()) && (selectedFilter === 'Tümü' || g.genre.includes(selectedFilter)))
    : assets.filter(a => a.title.toLowerCase().includes(search.toLowerCase()) && (selectedFilter === 'Tümü' || a.type === selectedFilter));

  // Yeni eklenenleri bulmak için listeyi tersine çeviriyoruz (En yeniler en üstte)
  const newArrivals = [...games].reverse().slice(0, 5);

  if (loading) {
    return <SafeAreaView style={[styles.safe, styles.center]}><ActivityIndicator size="large" color={COLORS.accentColor} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.navbarBg} />

      {/* NAVBAR */}
      <View style={styles.navbar}>
        <TouchableOpacity onPress={() => setViewMode('home')}>
          <Text style={styles.logo}>SHERIFF</Text>
        </TouchableOpacity>
        
        {user ? (
          <View style={styles.navActions}>
            <TouchableOpacity style={styles.panelBtn} onPress={() => router.push('/dashboard')}><Text style={styles.btnText}>PANELİM</Text></TouchableOpacity>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.btnText}>ÇIKIŞ</Text></TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login')}><Text style={styles.loginBtnText}>GİRİŞ</Text></TouchableOpacity>
        )}
      </View>

      <View style={styles.subNavbar}>
        <TouchableOpacity 
          style={[styles.navLink, viewMode === 'games' && styles.navLinkActive]} 
          onPress={() => { setViewMode('games'); setSelectedFilter('Tümü'); }}
        >
          <Text style={[styles.navLinkText, viewMode === 'games' && styles.navLinkTextActive]}>OYUNLAR</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navLink, viewMode === 'assets' && styles.navLinkActive]} 
          onPress={() => { setViewMode('assets'); setSelectedFilter('Tümü'); }}
        >
          <Text style={[styles.navLinkText, viewMode === 'assets' && styles.navLinkTextActive]}>ASSETLER</Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'home' ? (
        <ScrollView style={styles.homeScroll} showsVerticalScrollIndicator={false}>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🔥 Popüler Oyunlar</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
            {games.slice(0, 5).map(game => (
              <TouchableOpacity key={game.id} style={styles.largeCard} onPress={() => router.push({ pathname: '/detail', params: { id: game.id, type: 'Game' } })} activeOpacity={0.9}>
                <Image source={{ uri: game.image || 'https://via.placeholder.com/400x200' }} style={styles.largeCardImage} />
                <View style={styles.largeCardInfo}>
                  <Text style={styles.largeCardTitle} numberOfLines={1}>{game.title}</Text>
                  <View style={styles.largeCardFooter}>
                    <Text style={styles.largeCardGenre}>{game.genre.split(',')[0]}</Text>
                    <Text style={styles.largeCardPrice}>{game.price === 0 ? 'ÜCRETSİZ' : `₺${game.price}`}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🎨 Trend Assetler</Text></View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll} contentContainerStyle={{ paddingHorizontal: SPACING.xl }}>
            {assets.slice(0, 5).map(asset => (
              <TouchableOpacity key={asset.id} style={styles.largeCard} onPress={() => router.push({ pathname: '/detail', params: { id: asset.id, type: 'Asset' } })} activeOpacity={0.9}>
                <Image source={{ uri: asset.image || 'https://via.placeholder.com/400x200' }} style={styles.largeCardImage} />
                <View style={styles.largeCardInfo}>
                  <Text style={styles.largeCardTitle} numberOfLines={1}>{asset.title}</Text>
                  <View style={styles.largeCardFooter}>
                    <Text style={styles.largeCardGenre}>{asset.type}</Text>
                    <Text style={styles.largeCardPrice}>{asset.price === 0 ? 'ÜCRETSİZ' : `₺${asset.price}`}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>🚀 Yeni Eklenenler</Text></View>
          <View style={styles.verticalListContainer}>
            {newArrivals.map(game => (
              <TouchableOpacity key={game.id} style={styles.verticalCard} onPress={() => router.push({ pathname: '/detail', params: { id: game.id, type: 'Game' } })} activeOpacity={0.8}>
                <Image source={{ uri: game.image || 'https://via.placeholder.com/150' }} style={styles.verticalCardImage} />
                <View style={styles.verticalCardInfo}>
                  <Text style={styles.verticalCardTitle} numberOfLines={2}>{game.title}</Text>
                  <Text style={styles.verticalCardGenre}>{game.genre}</Text>
                  <Text style={styles.verticalCardPrice}>{game.price === 0 ? 'Ücretsiz' : `₺${game.price}`}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={{ height: 100 }} />
        </ScrollView>
      ) : (
        /* LİSTE GÖRÜNÜMÜ (OYUNLAR VEYA ASSETLER) */
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listPadding}
          renderItem={({ item }) => (
            viewMode === 'games' 
              ? <GameCard game={item} onPress={() => router.push({ pathname: '/detail', params: { id: item.id, type: 'Game' } })} />
              : <AssetCard asset={item} onPress={() => router.push({ pathname: '/detail', params: { id: item.id, type: 'Asset' } })} />
          )}
          ListHeaderComponent={
            <>
              <View style={styles.searchBox}>
                <TextInput style={styles.searchInput} placeholder={`${viewMode === 'games' ? 'Oyun' : 'Asset'} ara...`} placeholderTextColor={COLORS.mutedText} value={search} onChangeText={setSearch} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                {(viewMode === 'games' ? GAME_GENRES : ASSET_TYPES).map(f => (
                  <TouchableOpacity key={f} style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]} onPress={() => setSelectedFilter(f)}>
                    <Text style={[styles.filterChipText, selectedFilter === f && styles.filterChipTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
  center: { justifyContent: 'center', alignItems: 'center' },
  
  navbar: { backgroundColor: COLORS.navbarBg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, borderBottomWidth: 1, borderColor: '#333' },
  logo: { color: COLORS.accentColor, fontSize: 20, fontWeight: 'bold', letterSpacing: 2 },
  navActions: { flexDirection: 'row', gap: 8 },
  panelBtn: { backgroundColor: COLORS.secondaryAccent, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  logoutBtn: { backgroundColor: COLORS.accentColor, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.sm },
  btnText: { color: COLORS.white, fontSize: 10, fontWeight: 'bold' },
  loginBtn: { backgroundColor: COLORS.accentColor, paddingHorizontal: 15, paddingVertical: 8, borderRadius: RADIUS.sm },
  loginBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 12 },

  subNavbar: { flexDirection: 'row', backgroundColor: COLORS.navbarBg, borderBottomWidth: 2, borderBottomColor: COLORS.accentColor },
  navLink: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  navLinkActive: { borderBottomWidth: 3, borderBottomColor: COLORS.white },
  navLinkText: { color: COLORS.mutedText, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  navLinkTextActive: { color: COLORS.white },

  // Yenilenmiş Home Görünümü Stilleri
  homeScroll: { flex: 1, paddingTop: SPACING.lg },
  sectionHeader: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md, marginTop: SPACING.md },
  sectionTitle: { color: COLORS.white, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  horizontalScroll: { marginBottom: SPACING.xxl },
  
  // Büyük Vitrin Kartları
  largeCard: { width: width * 0.75, marginRight: SPACING.lg, backgroundColor: COLORS.cardBg, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: '#333' },
  largeCardImage: { width: '100%', height: 160, resizeMode: 'cover' },
  largeCardInfo: { padding: SPACING.md },
  largeCardTitle: { color: COLORS.white, fontSize: FONTS.sizes.md, fontWeight: 'bold', marginBottom: SPACING.sm },
  largeCardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  largeCardGenre: { color: COLORS.mutedText, fontSize: FONTS.sizes.xs, backgroundColor: '#161625', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm, overflow: 'hidden' },
  largeCardPrice: { color: COLORS.accentColor, fontWeight: 'bold', fontSize: FONTS.sizes.sm },

  // Dikey Yeni Eklenenler Kartları
  verticalListContainer: { paddingHorizontal: SPACING.xl },
  verticalCard: { flexDirection: 'row', backgroundColor: COLORS.cardBg, borderRadius: RADIUS.md, overflow: 'hidden', marginBottom: SPACING.md, borderWidth: 1, borderColor: '#333' },
  verticalCardImage: { width: 100, height: 100, resizeMode: 'cover' },
  verticalCardInfo: { flex: 1, padding: SPACING.md, justifyContent: 'center' },
  verticalCardTitle: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: 'bold', marginBottom: 4 },
  verticalCardGenre: { color: COLORS.mutedText, fontSize: FONTS.sizes.xs, marginBottom: 8 },
  verticalCardPrice: { color: COLORS.accentColor, fontWeight: 'bold', fontSize: FONTS.sizes.sm },

  // Liste Görünümü
  listPadding: { padding: SPACING.xl },
  row: { justifyContent: 'space-between', marginBottom: SPACING.md },
  searchBox: { backgroundColor: COLORS.cardBg, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.lg },
  searchInput: { color: COLORS.white, paddingVertical: 12 },
  filterScroll: { marginBottom: SPACING.xl },
  filterChip: { backgroundColor: COLORS.cardBg, paddingHorizontal: 15, paddingVertical: 8, borderRadius: RADIUS.full, marginRight: 8, borderWidth: 1, borderColor: '#444' },
  filterChipActive: { borderColor: COLORS.accentColor, backgroundColor: 'rgba(233,69,96,0.1)' },
  filterChipText: { color: COLORS.mutedText, fontSize: 12 },
  filterChipTextActive: { color: COLORS.accentColor, fontWeight: 'bold' }
});