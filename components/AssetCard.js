// =============================================
// SHERIFF GAMES - ASSET KARTI BİLEŞENİ
// =============================================

import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const PLACEHOLDER_IMAGE = require('../assets/images/sheriffGamesLogo.png');

export function AssetCard({ asset, onPress }) {
  const [imgError, setImgError] = useState(false);
  const isPlaceholder = !asset.image || imgError;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image 
          source={isPlaceholder ? PLACEHOLDER_IMAGE : { uri: asset.image }} 
          style={[
            styles.image, 
            isPlaceholder && { 
              resizeMode: 'contain', 
              width: '60%', 
              height: '60%', 
              opacity: 0.8 // Ne çok parlak ne de karanlıkta kayboluyor
            }
          ]}
          onError={() => setImgError(true)} 
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{asset.title}</Text>
        <Text style={styles.type}>{asset.type || 'Diğer'}</Text>
        <Text style={styles.price}>{asset.price === 0 || !asset.price ? 'Ücretsiz' : `₺${asset.price}`}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: COLORS.cardBg, 
    width: '48%', 
    borderRadius: RADIUS.md, 
    marginBottom: SPACING.lg, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: '#333' 
  },
  imageContainer: { 
    width: '100%', 
    height: 100, 
    backgroundColor: '#161625', // Temanın kendi lacivert/koyu gri tonuna döndük
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  image: { 
    width: '100%', 
    height: '100%', 
    resizeMode: 'cover' 
  },
  info: { 
    padding: SPACING.md 
  },
  title: { 
    color: COLORS.white, 
    fontSize: FONTS.sizes.sm, 
    fontWeight: 'bold', 
    marginBottom: 4 
  },
  type: { 
    color: COLORS.mutedText, 
    fontSize: 10, 
  },
  price: { 
    color: COLORS.accentColor, 
    fontWeight: 'bold', 
    fontSize: FONTS.sizes.sm 
  }
});