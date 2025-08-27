import { Dimensions, Platform } from 'react-native';

// Screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Layout
export const CONTAINER_PADDING = 20;
export const GRID_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
export const ITEM_GAP = 10;
export const ITEM_WIDTH = (GRID_WIDTH - ITEM_GAP) / 2;

export const PROFILE_RIGHT_MARGIN = Platform.OS === 'web' ? 0 : SCREEN_WIDTH / 35;

// Colors
export const COLORS = {
  background: '#141414',
  card: '#f1f5f9',
  cardDark: '#141414',
  primary: '#C41E3A',
  secondary: '#7358e0',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    dark: '#334155'
  },
  inactive: '#64748b',
  error: '#ef4444',
  white: '#ffffff',
  border: '#64748b',
  cardGray: '#212121',
};

export const AUTH_COLORS = {
background: '#141414',
  card: '#f1f5f9',
  cardDark: '#5e0e1c',
  primary: '#C41E3A',
  secondary: '#dd6f73',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    dark: '#334155'
  },
  inactive: '#FAF9F6',
  error: '#ef4444',
};

// Typography
export const TYPOGRAPHY = {
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  listTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  gridItemTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  body: {
    fontSize: 16,
  },
  caption: {
    fontSize: 14,
  },
};

// Spacings
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

let calculatedCardWidth;
if (Platform.OS === 'web') {
  const webScreenWidth = typeof window !== 'undefined' ? window.innerWidth : SCREEN_WIDTH;
  // If the screen is narrow 
  if (webScreenWidth < 768) { 
    // Make CARD_WIDTH responsive, e.g., screen width minus some padding
    calculatedCardWidth = webScreenWidth - 40; // Adjust 40 as needed (e.g., 20px padding on each side)
    calculatedCardWidth = Math.max(calculatedCardWidth, 300); // Example minimum
  } else {
    // For larger web screens
    calculatedCardWidth = 420;
  }
} else {
  // Native platforms
  calculatedCardWidth = SCREEN_WIDTH - 40;
}
export const CARD_WIDTH = calculatedCardWidth;

export default function theme() {
}