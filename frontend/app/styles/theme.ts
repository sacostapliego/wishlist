import { Dimensions, Platform } from 'react-native';

// Screen dimensions
export const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Layout
export const CONTAINER_PADDING = 20;
export const GRID_WIDTH = SCREEN_WIDTH - (CONTAINER_PADDING * 2);
export const ITEM_GAP = 10;
export const ITEM_WIDTH = (GRID_WIDTH - ITEM_GAP) / 2;
export const CARD_WIDTH = Platform.OS === 'web' ? 420 : SCREEN_WIDTH - 40;

export const PROFILE_RIGHT_MARGIN = Platform.OS === 'web' ? 0 : SCREEN_WIDTH / 35;

// Colors
export const COLORS = {
  background: '#141414',
  card: '#f1f5f9',
  cardDark: '#1e293b',
  primary: '#C41E3A',
  secondary: '#7358e0',
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.8)',
    dark: '#334155'
  },
  inactive: '#64748b',
  error: '#ef4444',
};

export const AUTH_COLORS = {
background: '#141414',
  card: '#f1f5f9',
  cardDark: '#5e0e1c',
  primary: '#C41E3A',
  secondary: '#ee91a1',
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

// Wishlist Colors Main
export const WISHLIST_COLORS = {
  coral: 'rgb(255, 127, 80)',             // coral
  lightseagreen: 'rgb(32, 178, 170)',     // light sea green
  purple: 'rgb(147, 112, 219)',           // purple
  ligtCoral: 'rgb(240, 128, 128)',        // light coral
  seaGreen: 'rgb(60, 179, 113)',          // sea green
  cornflowerBlue: 'rgb(100, 149, 237)',   // cornflower blue
  lightSalmon: 'rgb(255, 160, 122)',      // light salmon
  tomato: 'rgb(255, 99, 71)',             // tomato
  steelBlue: 'rgb(70, 130, 180)',         // steel blue
  orangeRed: 'rgb(255, 69, 0)',           // orange red
  orchid: 'rgb(218, 112, 214)',           // orchid
  gold: 'rgb(255, 215, 0)',               // gold
  greenYellow: 'rgb(173, 255, 47)',       // green yellow (change)
  offWhite: 'rgb(250, 249, 246)',         // offWhite
};

export default function theme() {
}