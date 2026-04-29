import React from 'react';
import { TouchableOpacity, Text, Image, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../constants/theme';

export const AssetCard = ({ asset, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
    <Image source={{ uri: asset.image }} style={styles.image} />
    <View style={styles.info}>
      <Text style={styles.title} numberOfLines={1}>{asset.title}</Text>
      <Text style={styles.price}>
        {asset.price === 0 ? 'Ücretsiz' : `₺${asset.price}`}
      </Text>
    </View>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  card: {
    width: '48%',
    backgroundColor: COLORS.cardBg,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  image: { width: '100%', height: 100 },
  info: { padding: SPACING.sm },
  title: { color: COLORS.white, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  price: { color: COLORS.assetTagColor, fontSize: FONTS.sizes.xs, marginTop: SPACING.xs }
});