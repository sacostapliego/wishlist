import { StyleSheet, View } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    marginVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
  },
  sectionTitle: {
    ...TYPOGRAPHY.sectionTitle,
    marginBottom: SPACING.md,
    color: COLORS.text.primary,
    fontSize: 18,
    fontWeight: "600"

  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.inactive,
    fontSize: TYPOGRAPHY.body.fontSize,
    paddingVertical: SPACING.xl,
  },
  shadow: {
    elevation: 4,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
  },
  centeredContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between',
  },
});

export const WEB_FRAME_WIDTH = 430;

export default function CommonStyles() {
}