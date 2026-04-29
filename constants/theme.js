// =============================================
// SHERIFF GAMES - TEMA SABİTLERİ
// Web sitesindeki CSS değişkenlerinin mobil karşılığı
// =============================================

export const COLORS = {
  bgColor: '#1a1a2e',           // --bg-color
  textColor: '#e0e0e0',         // --text-color
  accentColor: '#e94560',       // --accent-color (Kırmızımsı Pembe)
  cardBg: '#22223b',            // --card-bg
  secondaryAccent: '#6c63ff',   // --secondary-accent (Mor)
  assetTagColor: '#00bcd4',     // --asset-tag-color (Turkuaz)
  navbarBg: '#161625',
  inputBg: '#333',
  borderColor: '#444',
  mutedText: '#999',
  darkMuted: '#555',
  white: '#ffffff',
  black: '#000000',
  overlayDark: 'rgba(0,0,0,0.6)',
  accentTransparent: 'rgba(233,69,96,0.15)',
  secondaryTransparent: 'rgba(108,99,255,0.15)',
};

export const FONTS = {
  regular: 'System',
  bold: 'System',
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    title: 28,
    hero: 36,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 30,
  section: 40,
};

export const RADIUS = {
  sm: 4,
  md: 6,
  lg: 8,
  full: 50,
};

export const SHADOWS = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  navbar: {
    shadowColor: COLORS.accentColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 10,
  },
};