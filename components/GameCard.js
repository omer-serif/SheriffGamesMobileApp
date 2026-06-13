import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS, FONTS } from '../constants/theme';

const PLACEHOLDER_IMAGE = require('../assets/images/sheriffGamesLogo.png');

export function GameCard({ game, onPress }) {
  const [imgError, setImgError] = useState(false);
  const isPlaceholder = !game.image || imgError;
  const displayGenre = game.genre || game.categoryNames || 'Oyun';

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image 
          source={isPlaceholder ? PLACEHOLDER_IMAGE : (typeof game.image === 'string' ? { uri: game.image } : game.image)} 
          style={[
            styles.image, 
            isPlaceholder && { resizeMode: 'contain', width: '60%', height: '60%', opacity: 0.8 }
          ]}
          onError={() => setImgError(true)} 
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{game.title || game.gameName}</Text>
        <Text style={styles.genre}>{displayGenre.split(',')[0]}</Text>
        <Text style={styles.price}>{game.price == 0 || !game.price ? 'Ücretsiz' : `₺${game.price}`}</Text>
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
    backgroundColor: '#161625',
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
  genre: { 
    color: COLORS.mutedText, 
    fontSize: 10, 
    marginBottom: SPACING.sm 
  },
  price: { 
    color: COLORS.accentColor, 
    fontWeight: 'bold', 
    fontSize: FONTS.sizes.sm 
  }
});