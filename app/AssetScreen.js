import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, ActivityIndicator,
  StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { AssetCard, SectionTitle } from '../components';

const ASSET_TYPES = ['Tümü', 'Karakter', 'UI', 'Ses', 'Çevre', 'Animasyon'];
const API_URL = 'http://localhost:3001';

// Kendi logonuzu varsayılan resim olarak projeye dahil ediyoruz
const DEFAULT_IMAGE = require('../assets/images/sheriffGamesLogo.png');

export default function AssetsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Tümü');

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Rota /api/assets olarak güncellendi (server.js'deki yapıya uygun olması için)
    fetch(`${API_URL}/api/assets`)
      .then(response => response.json())
      .then(data => {
        const formattedAssets = data.map(item => ({
          id: item.assetID.toString(),
          title: item.assetName,
          price: item.assetPrice || 0,
          type: item.typeNames ? item.typeNames.split(', ')[0] : 'Diğer',
          // Resim varsa obje ({ uri: ... }), yoksa doğrudan require() dönüyoruz
          image: item.assetImage 
            ? { uri: `${API_URL}/uploads/${item.assetImage}` } 
            : DEFAULT_IMAGE,
        }));
        
        setAssets(formattedAssets);
        setLoading(false);
      })
      .catch(error => {
        console.error("Assetler çekilirken hata:", error);
        setLoading(false);
      });
  }, []);

  const filteredAssets = assets.filter(asset => {
    const matchSearch = asset.title.toLowerCase().includes(search.toLowerCase());
    const matchType = selectedType === 'Tümü' || asset.type === selectedType;
    return matchSearch && matchType;
  });

  const renderAsset = ({ item }) => (
    <AssetCard
      asset={item}
      onPress={() => alert(`${item.title} detaylarına gidilecek`)}
    />
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.accentColor} />
        <Text style={{ color: COLORS.white, marginTop: 10 }}>Assetler Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
       {/* Dosyanın orijinal return bloğunun devamı (Flatlist vs.) */}
       <View style={{ padding: SPACING.md }}>
         <TextInput 
           style={{ backgroundColor: COLORS.cardBg, color: COLORS.white, padding: 10, borderRadius: RADIUS.sm }}
           placeholder="Asset Ara..."
           placeholderTextColor={COLORS.mutedText}
           value={search}
           onChangeText={setSearch}
         />
       </View>
       <FlatList
         data={filteredAssets}
         keyExtractor={(item) => item.id}
         renderItem={renderAsset}
       />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgColor },
});