import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import { COLORS, FONTS, SPACING } from '../constants/theme';

export const SectionTitle = ({ title }) => (
  <View style={styles.container}>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  title: {
    color: COLORS.white,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
  }
});