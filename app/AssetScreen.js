// =============================================
// SHERIFF GAMES - ASSETLER SAYFASI - VERİTABANI BAĞLANTILI
// =============================================

import React, { useState, useEffect } from 'react';
import {
  View, Text, FlatList, TextInput, ActivityIndicator,
  StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';
import { AssetCard, SectionTitle } from '../components';

const ASSET_TYPES = ['Tümü', 'Karakter', 'UI', 'Ses', 'Çevre', 'Animasyon'];
const API_URL = 'http://localhost:3001';

export default function AssetsScreen({ navigation }) {
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('Tümü');

  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/assets`)
      .then(response => response.json())
      .then(data => {
        const formattedAssets = data.map(item => ({
          id: item.assetID.toString(),
          title: item.assetName,
          price: item.assetPrice || 0,
          type: item.typeNames ? item.typeNames.split(', ')[0] : 'Diğer',
          image: item.assetImage ? `${API_URL}/uploads/${item.assetImage}` : 'https://via.placeholder.com/400x250',
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
        <ActivityIndicator size="large" color={COLORS.assetTagColor} />
        <Text style={{ color: COLORS.white, marginTop: 10 }}>Assetler Yükleniyor...</Text>
      </SafeAreaView>
    );
  }
}