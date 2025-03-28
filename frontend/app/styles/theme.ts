import { Dimensions } from 'react-native';

// Screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Layout
export const CONTAINER_PADDING = 20;
export const GRID_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
export const ITEM_GAP = 10;
export const ITEM_WIDTH = (GRID_WIDTH - ITEM_GAP) / 2;
export const CARD_WIDTH = SCREEN_WIDTH - 40;

// Colors
export const COLORS = {
  background: '#141414',
  card: '#f1f5f9',
  cardDark: '#1e293b',
  primary: '#0891b2',
  secondary: '#7358e0',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    dark: '#334155'
  },
  inactive: '#64748b',
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